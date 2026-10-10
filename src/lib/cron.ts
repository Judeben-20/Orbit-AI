import * as parser from "cron-parser";

export function calculateNextRunAt(cronExpression: string, timezone: string, fromDate = new Date()): Date {
  try {
    const interval = parser.parseExpression(cronExpression, {
      currentDate: fromDate,
      tz: timezone || "UTC",
    });
    return interval.next().toDate();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid cron expression or timezone: ${message}`);
  }
}

export function isValidCron(cronExpression: string): boolean {
  try {
    parser.parseExpression(cronExpression);
    return true;
  } catch {
    return false;
  }
}
