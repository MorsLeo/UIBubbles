import { expect, test } from "@playwright/test";
import { bubble, focusedLabel, settled } from "./helpers";

// Keyboard model: the open row is one tab stop with arrow-key roaming,
// Enter/Space activates, Delete dismisses the focused bubble.

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.waitForFunction(() => !!window.bubbles);
});

test("arrow keys move focus across the open row", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "A" });
		window.bubbles.add({ id: "b", label: "B", panelText: "B" });
		window.bubbles.add({ id: "c", label: "C", panelText: "C" });
		window.bubbles.toggle();
	});
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await settled(page);

	// Row order is newest-first (C B A); the active newest bubble holds focus.
	expect(await focusedLabel(page)).toBe("C");
	await page.keyboard.press("ArrowRight");
	expect(await focusedLabel(page)).toBe("B");
	await page.keyboard.press("ArrowRight");
	expect(await focusedLabel(page)).toBe("A");
	// Clamps at the end rather than wrapping.
	await page.keyboard.press("ArrowRight");
	expect(await focusedLabel(page)).toBe("A");
	await page.keyboard.press("ArrowLeft");
	expect(await focusedLabel(page)).toBe("B");
});

test("Delete dismisses the focused row bubble and moves focus to a neighbor", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "A" });
		window.bubbles.add({ id: "b", label: "B", panelText: "B" });
		window.bubbles.toggle();
	});
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await settled(page);

	// Row B A; focus is on B (newest, active).
	expect(await focusedLabel(page)).toBe("B");
	await page.keyboard.press("Delete");

	await expect(bubble(page, "B")).toHaveCount(0);
	await expect.poll(() => focusedLabel(page)).toBe("A");
});

test("Enter on the docked stack expands it", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "A" });
	});
	await settled(page);

	await bubble(page, "A").focus();
	await page.keyboard.press("Enter");
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
});
