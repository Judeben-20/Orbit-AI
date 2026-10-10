import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { routineRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { z } from "zod";

const approvalSchema = z.object({
  decision: z.enum(["approve", "reject"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: runId } = await params;
    const body = await req.json();
    const { decision } = approvalSchema.parse(body);

    const run = await db.query.routineRuns.findFirst({
      where: eq(routineRuns.id, runId),
      with: {
        routine: true,
      },
    });

    if (!run || !run.routine || run.routine.userId !== userId) {
      return new NextResponse("Run not found or unauthorized", { status: 404 });
    }

    if (run.status !== "needs_approval") {
      return new NextResponse("Run does not require approval", { status: 400 });
    }

    if (decision === "reject") {
      await db
        .update(routineRuns)
        .set({
          status: "failed",
          error: "Rejected by user",
          finishedAt: new Date(),
        })
        .where(eq(routineRuns.id, runId));
    }

    // Send inngest event to wake up routine runner
    await inngest.send({
      name: "approval/decision",
      data: {
        runId,
        decision,
        approvedBy: userId,
      },
    });

    return NextResponse.json({ success: true, decision });
  } catch (error) {
    console.error("[APPROVAL_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
