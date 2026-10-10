import { db } from "@/lib/db";
import { usage } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { QUOTA_LIMITS } from "./quota-config";

export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function getUserUsage(userId: string) {
  const period = getCurrentPeriod();
  const record = await db.query.usage.findFirst({
    where: and(eq(usage.userId, userId), eq(usage.period, period)),
  });

  return {
    period,
    tokensUsed: record?.tokensUsed ?? 0,
    runsUsed: record?.runsUsed ?? 0,
  };
}

export async function incrementChatUsage(userId: string) {
  const period = getCurrentPeriod();
  const current = await getUserUsage(userId);

  const existing = await db.query.usage.findFirst({
    where: and(eq(usage.userId, userId), eq(usage.period, period)),
  });

  if (existing) {
    await db
      .update(usage)
      .set({ tokensUsed: existing.tokensUsed + 1 })
      .where(and(eq(usage.userId, userId), eq(usage.period, period)));
  } else {
    await db.insert(usage).values({
      userId,
      period,
      tokensUsed: 1,
      runsUsed: 0,
    });
  }

  return current.tokensUsed + 1;
}

export async function incrementRunUsage(userId: string) {
  const period = getCurrentPeriod();
  const existing = await db.query.usage.findFirst({
    where: and(eq(usage.userId, userId), eq(usage.period, period)),
  });

  if (existing) {
    await db
      .update(usage)
      .set({ runsUsed: existing.runsUsed + 1 })
      .where(and(eq(usage.userId, userId), eq(usage.period, period)));
  } else {
    await db.insert(usage).values({
      userId,
      period,
      tokensUsed: 0,
      runsUsed: 1,
    });
  }
}

export async function checkChatQuota(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const current = await getUserUsage(userId);
  const remaining = QUOTA_LIMITS.MONTHLY_CHAT_MESSAGES - current.tokensUsed;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
  };
}

export async function checkRunQuota(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const current = await getUserUsage(userId);
  const remaining = QUOTA_LIMITS.MONTHLY_ROUTINE_RUNS - current.runsUsed;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
  };
}
