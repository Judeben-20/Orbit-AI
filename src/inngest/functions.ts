import { inngest } from "./client";
import { db } from "@/lib/db";
import { routines, routineRuns as runsTable, messages as messagesTable } from "@/lib/db/schema";
import { lte, and, eq, count } from "drizzle-orm";
import * as parser from "cron-parser";
import { checkRunQuota, incrementRunUsage } from "@/lib/usage";
import { isIrreversibleAction } from "@/lib/risk";

// 1. Dispatcher: runs every 5 minutes
export const dispatchRoutines = inngest.createFunction(
  { id: "dispatch-routines" },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    const now = new Date();
    const slotTimestamp = Math.floor(now.getTime() / (5 * 60 * 1000));

    const routinesToRun = await step.run("fetch-routines", async () => {
      const activeRoutines = await db.query.routines.findMany({
        where: and(
          eq(routines.status, "active"),
          lte(routines.nextRunAt, now)
        ),
        with: {
          agent: true,
        },
      });

      // Filter to only include routines where agent is active
      return activeRoutines.filter((r) => r.agent && r.agent.isActive);
    });

    if (routinesToRun.length === 0) return { dispatched: 0 };

    // Unique event ID for idempotency: routineId + slot
    const events = routinesToRun.map((routine) => ({
      name: "routine/run",
      id: `${routine.id}-${slotTimestamp}`,
      data: { routineId: routine.id, userId: routine.userId },
    }));

    await step.sendEvent("dispatch-events", events);

    // Update nextRunAt for all dispatched routines
    await step.run("update-next-run", async () => {
      for (const routine of routinesToRun) {
        try {
          const interval = parser.parseExpression(routine.cron, {
            tz: routine.timezone || "UTC",
          });
          const nextRunAt = interval.next().toDate();
          await db
            .update(routines)
            .set({ nextRunAt })
            .where(eq(routines.id, routine.id));
        } catch {
          console.error(`Error updating next run for routine ${routine.id}`);
        }
      }
    });

    return { dispatched: routinesToRun.length };
  }
);

// 2. Runner: executes a single routine
export const executeRoutine = inngest.createFunction(
  {
    id: "execute-routine",
    retries: 3,
  },
  { event: "routine/run" },
  async ({ event, step }) => {
    const { routineId, userId } = event.data;

    // Check user quota
    const quotaCheck = await step.run("check-quota", async () => {
      return await checkRunQuota(userId);
    });

    if (!quotaCheck.allowed) {
      return { skipped: true, reason: "Monthly routine run quota exhausted" };
    }

    // Check concurrent runs limit (max 2)
    const runningCount = await step.run("check-concurrency", async () => {
      const [res] = await db
        .select({ count: count() })
        .from(runsTable)
        .where(eq(runsTable.status, "running"));
      return res?.count || 0;
    });

    if (runningCount >= 2) {
      // Re-queue after 30 seconds
      await step.sleep("wait-for-slot", "30s");
    }

    const routine = await step.run("fetch-routine", async () => {
      return await db.query.routines.findFirst({
        where: eq(routines.id, routineId),
        with: { agent: true },
      });
    });

    if (!routine || routine.status !== "active" || !routine.agent?.isActive) {
      return { error: "Routine or agent inactive" };
    }

    const runId = await step.run("create-run-record", async () => {
      const [newRun] = await db
        .insert(runsTable)
        .values({
          routineId,
          status: "running",
          startedAt: new Date(),
        })
        .returning();
      return newRun.id;
    });

    try {
      // Execute routine action
      const executionResult = await step.run("execute-routine-prompt", async () => {
        const promptContext = `<untrusted_content>${routine.prompt}</untrusted_content>`;

        // Check if routine prompt requests an irreversible action
        if (isIrreversibleAction(routine.prompt)) {
          return { needsApproval: true, output: null, proposedAction: routine.prompt };
        }

        // Simulating/Executing AI output
        return {
          needsApproval: false,
          output: `[Routine Output for "${routine.title}"]: Executed successfully at ${new Date().toISOString()}.\nPrompt context: ${promptContext.slice(0, 50)}...`,
          proposedAction: null,
        };
      });

      if (executionResult.needsApproval) {
        // Set run status to needs_approval
        await step.run("mark-needs-approval", async () => {
          await db
            .update(runsTable)
            .set({ status: "needs_approval" })
            .where(eq(runsTable.id, runId));
        });

        // Wait for approval event up to 24 hours
        const approvalEvent = await step.waitForEvent("wait-for-approval", {
          event: "approval/decision",
          timeout: "24h",
          match: "data.runId",
        });

        if (!approvalEvent || approvalEvent.data?.decision !== "approve") {
          await step.run("mark-rejected", async () => {
            await db
              .update(runsTable)
              .set({
                status: "failed",
                error: "Run was rejected or expired after 24 hours",
                finishedAt: new Date(),
              })
              .where(eq(runsTable.id, runId));
          });
          return { success: false, reason: "Rejected or timed out" };
        }
      }

      const finalOutput = executionResult.output || `Routine "${routine.title}" finished successfully.`;

      // Save success state
      await step.run("complete-run", async () => {
        await db
          .update(runsTable)
          .set({
            status: "success",
            output: finalOutput,
            finishedAt: new Date(),
          })
          .where(eq(runsTable.id, runId));

        // Write summary into agent chat
        await db.insert(messagesTable).values({
          agentId: routine.agentId,
          userId: routine.userId,
          role: "assistant",
          content: `⏱️ **Scheduled Routine Executed**: "${routine.title}"\n\n${finalOutput}`,
        });

        // Increment run usage
        await incrementRunUsage(routine.userId);
      });

      return { success: true, runId, output: finalOutput };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Execution error";
      await step.run("fail-run", async () => {
        await db
          .update(runsTable)
          .set({
            status: "failed",
            error: errorMsg,
            finishedAt: new Date(),
          })
          .where(eq(runsTable.id, runId));
      });
      throw error;
    }
  }
);

export const functions = [dispatchRoutines, executeRoutine];
