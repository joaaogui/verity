import { expect, test } from "@playwright/test";

test.describe("Verity trust and accessibility copy", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("discloses provider, retention, truncation, and AI limitations", async ({
    page,
  }) => {
    await expect(page.getByText(/Analyzed by Google Gemini/i)).toBeVisible();
    await expect(page.getByText(/does not keep your files after the request/i)).toBeVisible();
    await expect(page.getByText(/PDFs longer than 3 pages/i)).toBeVisible();
    await expect(page.getByText(/assistive AI estimates/i)).toBeVisible();
  });

  test("preset expectations are keyboard-focusable buttons", async ({ page }) => {
    const preset = page.getByRole("button", {
      name: "A recent electricity or gas utility bill",
    });

    await expect(preset).toBeVisible();
    await preset.focus();
    await expect(preset).toBeFocused();
    await preset.press("Enter");
    await expect(preset).toHaveAttribute("aria-pressed", "true");
  });
});
