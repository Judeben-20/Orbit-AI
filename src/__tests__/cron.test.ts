import { describe, it, expect } from "vitest";
import { calculateNextRunAt, isValidCron } from "@/lib/cron";

describe("Cron and Timezone Helper Tests", () => {
  it("should validate standard cron expressions", () => {
    expect(isValidCron("0 8 * * *")).toBe(true);
    expect(isValidCron("*/5 * * * *")).toBe(true);
    expect(isValidCron("invalid cron")).toBe(false);
  });

  it("should compute next run time accurately for daily at 8am in UTC", () => {
    const fromDate = new Date("2026-01-01T00:00:00Z");
    const nextRun = calculateNextRunAt("0 8 * * *", "UTC", fromDate);
    expect(nextRun.toISOString()).toBe("2026-01-01T08:00:00.000Z");
  });

  it("should calculate next run time across timezone boundaries", () => {
    const fromDate = new Date("2026-01-01T00:00:00Z");
    const nextRun = calculateNextRunAt("0 8 * * *", "America/New_York", fromDate);
    expect(nextRun).toBeInstanceOf(Date);
    expect(nextRun.getTime()).toBeGreaterThan(fromDate.getTime());
  });
});
