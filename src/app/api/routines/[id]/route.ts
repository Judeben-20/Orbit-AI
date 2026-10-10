import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { routines } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["active", "paused", "proposed"]).optional(),
  title: z.string().optional(),
  prompt: z.string().optional(),
  cron: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = patchSchema.parse(body);

    const [updated] = await db
      .update(routines)
      .set(validated)
      .where(and(eq(routines.id, id), eq(routines.userId, userId)))
      .returning();

    if (!updated) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ROUTINE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(routines)
      .where(and(eq(routines.id, id), eq(routines.userId, userId)))
      .returning();

    if (!deleted) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ROUTINE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
