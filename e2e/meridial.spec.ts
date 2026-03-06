import path from "node:path";
import { expect, test } from "@playwright/test";

const FIXTURE = path.join(__dirname, "fixtures/test-doc.png");

const MOCK_ADDRESS = {
  fullName: "Jane Doe",
  streetAddress: "123 Main St",
  city: "Springfield",
  state: "IL",
  zipCode: "62704",
  country: "USA",
};

test.describe("Meridial main flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/meridial");
  });

  test("shows cookie banner on load and dismisses it", async ({ page }) => {
    await expect(page.getByText("I AGREE")).toBeVisible();
    await page.getByText("I AGREE").click();
    await expect(page.getByText("I AGREE")).toBeHidden();
  });

  test("step 1 → step 2: welcome to upload", async ({ page }) => {
    await page.getByText("I AGREE").click();

    await expect(page.getByText("Welcome to Invisible Marketplace")).toBeVisible();
    await expect(page.getByText("STEP 1/5")).toBeVisible();

    await page.getByText("UPLOAD DOCUMENT").click();

    await expect(page.getByText("Upload Document")).toBeVisible();
    await expect(page.getByText("STEP 2/5")).toBeVisible();
  });

  test("step 2 → step 1: back from upload returns to welcome", async ({ page }) => {
    await page.getByText("I AGREE").click();
    await page.getByText("UPLOAD DOCUMENT").click();

    await page.getByLabel("Go back").click();

    await expect(page.getByText("Welcome to Invisible Marketplace")).toBeVisible();
  });

  test("step 2: file upload shows selected state", async ({ page }) => {
    await page.getByText("I AGREE").click();
    await page.getByText("UPLOAD DOCUMENT").click();

    await page.route("/api/meridial/extract", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({ json: MOCK_ADDRESS });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE);

    await expect(page.getByText("File selected")).toBeVisible();
  });

  test("full flow: upload → analyzing → verification → complete", async ({ page }) => {
    await page.getByText("I AGREE").click();
    await page.getByText("UPLOAD DOCUMENT").click();

    await page.route("/api/meridial/extract", async (route) => {
      await route.fulfill({ json: MOCK_ADDRESS });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE);

    await expect(page.getByText("Confirm your details")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("STEP 4/5")).toBeVisible();

    await expect(page.locator('input[value="123 Main St"]')).toBeVisible();
    await expect(page.locator('input[value="Springfield"]')).toBeVisible();
    await expect(page.locator('input[value="IL"]')).toBeVisible();
    await expect(page.locator('input[value="62704"]')).toBeVisible();
    await expect(page.locator('input[value="USA"]')).toBeVisible();

    await page.getByText("CONTINUE").click();

    await expect(page.getByText("Verification Complete")).toBeVisible();
    await expect(page.getByText("STEP 5/5")).toBeVisible();
  });

  test("step 4 → step 2: back from verification returns to upload", async ({ page }) => {
    await page.getByText("I AGREE").click();
    await page.getByText("UPLOAD DOCUMENT").click();

    await page.route("/api/meridial/extract", async (route) => {
      await route.fulfill({ json: MOCK_ADDRESS });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE);

    await expect(page.getByText("Confirm your details")).toBeVisible({ timeout: 10000 });

    await page.getByLabel("Go back").click();

    await expect(page.getByText("Upload Document")).toBeVisible();
  });

  test("shows extraction error banner when API returns empty fields", async ({ page }) => {
    await page.getByText("I AGREE").click();
    await page.getByText("UPLOAD DOCUMENT").click();

    await page.route("/api/meridial/extract", async (route) => {
      await route.fulfill({
        json: { fullName: "", streetAddress: "", city: "", state: "", zipCode: "", country: "" },
      });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE);

    await expect(page.getByText("Confirm your details")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("fill in your details manually")).toBeVisible();
  });

  test("shows upload error when API fails", async ({ page }) => {
    await page.getByText("I AGREE").click();
    await page.getByText("UPLOAD DOCUMENT").click();

    await page.route("/api/meridial/extract", async (route) => {
      await route.fulfill({ status: 500, json: { error: "Server error" } });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE);

    await expect(page.getByText("Server error")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Click to try again")).toBeVisible();
  });

  test("footer links are present", async ({ page }) => {
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/meridial/privacy");
    await expect(nav.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "/meridial/terms");
  });
});
