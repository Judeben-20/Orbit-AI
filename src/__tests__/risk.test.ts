import { describe, it, expect } from "vitest";
import { isIrreversibleAction, IRREVERSIBLE_ACTIONS } from "@/lib/risk";

describe("Risk List & Irreversible Actions Tests", () => {
  it("should identify send_email as irreversible", () => {
    expect(isIrreversibleAction("send_email")).toBe(true);
    expect(isIrreversibleAction("Please send an email to john")).toBe(true);
  });

  it("should identify post_message as irreversible", () => {
    expect(isIrreversibleAction("post_message")).toBe(true);
  });

  it("should allow safe read actions", () => {
    expect(isIrreversibleAction("read_unread_emails")).toBe(false);
    expect(isIrreversibleAction("list_slack_channels")).toBe(false);
  });

  it("should contain all required irreversible actions in constant list", () => {
    expect(IRREVERSIBLE_ACTIONS).toContain("send_email");
    expect(IRREVERSIBLE_ACTIONS).toContain("post_message");
    expect(IRREVERSIBLE_ACTIONS).toContain("delete");
  });
});
