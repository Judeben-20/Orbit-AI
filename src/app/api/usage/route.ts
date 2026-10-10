import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usage } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM

    const usageRecord = await db.query.usage.findFirst({
      where: and(eq(usage.userId, userId), eq(usage.period, currentPeriod)),
    });

    if (!usageRecord) {
      return NextResponse.json({ tokensUsed: 0, runsUsed: 0 });
    }

    return NextResponse.json(usageRecord);
  } catch (error) {
    console.error("[USAGE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
