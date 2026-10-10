import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { routines } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/inngest/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const routine = await db.query.routines.findFirst({
      where: and(eq(routines.id, id), eq(routines.userId, userId)),
    });

    if (!routine) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await inngest.send({
      name: "routine/run",
      data: { routineId: id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ROUTINES_RUN_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
