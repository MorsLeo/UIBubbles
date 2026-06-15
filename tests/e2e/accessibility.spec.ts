import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const playgroundUrl = "http://localhost:5173/?theme=dark";

test.describe("playground accessibility", () => {
	test.beforeEach(async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== "chromium", "Playground accessibility scans run once.");
		await page.goto(playgroundUrl);
		await page.waitForFunction(() =>
			document.querySelector('[role="dialog"][aria-label="Settings"]')
		);
	});

	test("has no automatically detectable axe violations", async ({ page }) => {
		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});

	test("has named controls and valid aria-controls references", async ({ page }) => {
		const unnamed = await page
			.locator("a[href], button, input, [role='button']")
			.evaluateAll((els) =>
				els
					.filter((el) => {
						const style = getComputedStyle(el);
						return style.display !== "none" && el.getAttribute("aria-hidden") !== "true";
					})
					.filter((el) => {
						if (el.getAttribute("aria-label")) return false;
						if (el instanceof HTMLInputElement && el.labels && el.labels.length > 0) return false;
						return (el.textContent ?? "").trim() === "";
					})
					.map((el) => el.outerHTML)
			);
		expect(unnamed).toEqual([]);

		const brokenControls = await page
			.locator("[aria-controls]")
			.evaluateAll((els) =>
				els
					.map((el) => el.getAttribute("aria-controls"))
					.filter((id): id is string => id !== null && document.getElementById(id) === null)
			);
		expect(brokenControls).toEqual([]);
	});

	test("announces generated docs links that open a new tab", async ({ page }) => {
		await page
			.locator('[role="button"][aria-label="Docs"][aria-controls="bubble-panel-docs"]')
			.click();
		const externalLinks = page.locator("[role='dialog'][aria-label='Docs'] a[target='_blank']");
		await expect(externalLinks.first()).toContainText("opens in new tab");
	});
});
