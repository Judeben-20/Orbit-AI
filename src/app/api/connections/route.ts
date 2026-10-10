import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface ComposioConnectionItem {
  id: string;
  appId?: string;
  appName?: string;
}

interface ComposioEntityInstance {
  getConnections: () => Promise<ComposioConnectionItem[]>;
  initiateConnection: (appSlug: string, redirectUrl: string) => Promise<{ redirectUrl: string }>;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { getComposio } = await import("@/lib/composio");
    const composio = getComposio() as unknown as {
      authenticateUser: (id: string) => Promise<ComposioEntityInstance>;
    };

    let composioConnections: ComposioConnectionItem[] = [];
    if (typeof composio.authenticateUser === "function") {
      const entity = await composio.authenticateUser(userId);
      if (entity && typeof entity.getConnections === "function") {
        composioConnections = await entity.getConnections();
      }
    }

    // Sync with DB
    const existing = await db.query.connections.findMany({
      where: eq(connections.userId, userId),
    });

    const existingIds = new Set(existing.map((c) => c.composioConnectedAccountId));

    for (const compConn of composioConnections) {
      if (!existingIds.has(compConn.id)) {
        await db.insert(connections).values({
          userId,
          appSlug: compConn.appId || compConn.appName || "unknown",
          composioConnectedAccountId: compConn.id,
          status: "ACTIVE",
        });
      }
    }

    const userConnections = await db.query.connections.findMany({
      where: eq(connections.userId, userId),
    });

    return NextResponse.json(userConnections);
  } catch (error) {
    console.error("[CONNECTIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { appSlug } = await req.json();
    if (!appSlug) {
      return new NextResponse("Missing appSlug", { status: 400 });
    }

    const { getComposio } = await import("@/lib/composio");
    const composio = getComposio() as unknown as {
      authenticateUser: (id: string) => Promise<ComposioEntityInstance>;
    };

    const entity = await composio.authenticateUser(userId);
    const connection = await entity.initiateConnection(
      appSlug,
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/connections/callback`
    );

    return NextResponse.json({ url: connection.redirectUrl });
  } catch (error) {
    console.error("[CONNECTIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
