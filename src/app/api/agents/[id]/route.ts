import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  instructions: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
  avatarSeed: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, id), eq(agents.userId, userId)),
    });

    if (!agent) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("[AGENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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
    const validated = updateAgentSchema.parse(body);

    const [updatedAgent] = await db.update(agents)
      .set(validated)
      .where(and(eq(agents.id, id), eq(agents.userId, userId)))
      .returning();

    if (!updatedAgent) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(updatedAgent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[AGENT_PATCH]", error);
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

    const [deletedAgent] = await db.delete(agents)
      .where(and(eq(agents.id, id), eq(agents.userId, userId)))
      .returning();

    if (!deletedAgent) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[AGENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
