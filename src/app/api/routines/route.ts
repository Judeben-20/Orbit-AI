import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { routines } from "@/lib/db/schema";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import * as parser from "cron-parser";

const routineSchema = z.object({
  agentId: z.string().uuid(),
  title: z.string(),
  prompt: z.string(),
  cron: z.string(),
  timezone: z.string(),
  requiredApps: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validated = routineSchema.parse(body);

    // Calculate next run
    let nextRunAt = null;
    try {
      const interval = parser.parseExpression(validated.cron, { tz: validated.timezone });
      nextRunAt = interval.next().toDate();
    } catch {
      return new NextResponse("Invalid cron expression or timezone", { status: 400 });
    }

    const [newRoutine] = await db.insert(routines).values({
      userId,
      agentId: validated.agentId,
      title: validated.title,
      prompt: validated.prompt,
      cron: validated.cron,
      timezone: validated.timezone,
      requiredApps: validated.requiredApps || [],
      status: "active",
      nextRunAt,
    }).returning();

    return NextResponse.json(newRoutine);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[ROUTINES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      const allRoutines = await db.query.routines.findMany({
        where: eq(routines.userId, userId),
      });
      return NextResponse.json(allRoutines);
    }

    const agentRoutines = await db.query.routines.findMany({
      where: and(eq(routines.agentId, agentId), eq(routines.userId, userId)),
    });

    return NextResponse.json(agentRoutines);
  } catch (error) {
    console.error("[ROUTINES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
