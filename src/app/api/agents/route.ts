import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  instructions: z.string().max(2000).optional(),
  avatarSeed: z.string().optional(),
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userAgents = await db.query.agents.findMany({
      where: eq(agents.userId, userId),
      orderBy: (agents, { desc }) => [desc(agents.createdAt)],
    });

    return NextResponse.json(userAgents);
  } catch (error) {
    console.error("[AGENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validated = createAgentSchema.parse(body);

    const [newAgent] = await db.insert(agents).values({
      userId,
      name: validated.name,
      instructions: validated.instructions || "",
      avatarSeed: validated.avatarSeed || Math.random().toString(36).substring(7),
    }).returning();

    return NextResponse.json(newAgent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }
    console.error("[AGENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
