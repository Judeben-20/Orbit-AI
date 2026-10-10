import { describe, it, expect } from "vitest";

function isUserOwner(resourceUserId: string, currentUserId: string): boolean {
  if (!resourceUserId || !currentUserId) return false;
  return resourceUserId === currentUserId;
}

describe("Ownership Check Tests", () => {
  it("should return true when resource user ID matches authenticated user ID", () => {
    expect(isUserOwner("user_123", "user_123")).toBe(true);
  });

  it("should return false when user IDs do not match", () => {
    expect(isUserOwner("user_123", "user_456")).toBe(false);
  });

  it("should return false when user ID is missing", () => {
    expect(isUserOwner("", "user_123")).toBe(false);
    expect(isUserOwner("user_123", "")).toBe(false);
  });
});
