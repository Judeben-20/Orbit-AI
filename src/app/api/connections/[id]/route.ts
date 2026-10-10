import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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

    // Optional: remove from composio too if we want
    // const { getComposio } = await import("@/lib/composio");
    // const composio = getComposio();
    // const entity = await composio.authenticateUser(userId);
    // await composio.connections.delete({ connectionId: ... });

    const [deleted] = await db.delete(connections)
      .where(and(eq(connections.id, id), eq(connections.userId, userId)))
      .returning();

    if (!deleted) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CONNECTIONS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
