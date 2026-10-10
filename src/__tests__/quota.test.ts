import { describe, it, expect } from "vitest";
import { QUOTA_LIMITS } from "@/lib/quota-config";

describe("Quota Configuration Tests", () => {
  it("should enforce exactly 200 chat messages and 30 routine runs monthly limits", () => {
    expect(QUOTA_LIMITS.MONTHLY_CHAT_MESSAGES).toBe(200);
    expect(QUOTA_LIMITS.MONTHLY_ROUTINE_RUNS).toBe(30);
  });
});
