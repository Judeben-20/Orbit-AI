import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, connections, routines, usage } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Best effort revoke Composio connections
    try {
      const { getComposio } = await import("@/lib/composio");
      const composio = (getComposio() as unknown) as Record<string, unknown>;
      if (typeof composio.authenticateUser === "function") {
        const entity = await (composio.authenticateUser as (id: string) => Promise<{ getConnections: () => Promise<Array<{ id: string }>> }>)(userId);
        const userConnections = await entity.getConnections();
        for (const conn of userConnections) {
          try {
            const connApi = composio.connections as { delete: (params: { connectionId: string }) => Promise<unknown> };
            if (connApi && typeof connApi.delete === "function") {
              await connApi.delete({ connectionId: conn.id });
            }
          } catch (err) {
            console.error(`Failed to revoke Composio connection ${conn.id}:`, err);
          }
        }
      }
    } catch (err) {
      console.warn("Composio revoke skipped or failed:", err);
    }

    // Delete DB records
    await db.delete(agents).where(eq(agents.userId, userId));
    await db.delete(connections).where(eq(connections.userId, userId));
    await db.delete(routines).where(eq(routines.userId, userId));
    await db.delete(usage).where(eq(usage.userId, userId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ACCOUNT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
