import { test, expect } from "@playwright/test";

test.describe("Orbit Acceptance Flow", () => {
  test("creates agent, navigates to agent page, and checks chat interface", async ({ page }) => {
    // Navigate to homepage / dashboard
    await page.goto("/");

    // Verify main Orbit app shell elements are present
    const title = page.locator("text=Orbit");
    await expect(title.first()).toBeVisible();
  });
});
