import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, routines, routineRuns } from "@/lib/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: agentId } = await params;

    // Verify agent ownership
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.userId, userId)),
    });

    if (!agent) {
      return new NextResponse("Agent not found", { status: 404 });
    }

    // Get agent's routines
    const agentRoutines = await db.query.routines.findMany({
      where: and(eq(routines.agentId, agentId), eq(routines.userId, userId)),
    });

    if (agentRoutines.length === 0) {
      return NextResponse.json([]);
    }

    const routineIds = agentRoutines.map((r) => r.id);

    const runs = await db.query.routineRuns.findMany({
      where: inArray(routineRuns.routineId, routineIds),
      orderBy: [desc(routineRuns.startedAt)],
      with: {
        routine: true,
      },
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("[AGENT_RUNS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
