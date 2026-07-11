import { expect, test } from "@playwright/test";
import { bubble, dragTo, settled } from "./helpers";

// Fork change (MorsLeo/UIBubbles): the open row is no longer pinned to the
// top center. Dragging an open bubble moves the row — its landing becomes
// the row's new anchor and the other bubbles reflow around it.

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.waitForFunction(() => !!window.bubbles);
});

const center = async (page: import("@playwright/test").Page, label: string) => {
	const box = await bubble(page, label).boundingBox();
	if (!box) throw new Error(`no box for "${label}"`);
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test("the rest of the row reflows around the dragged bubble", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "A" });
		window.bubbles.add({ id: "b", label: "B", panelText: "B" });
		window.bubbles.activate("b");
	});
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await settled(page);

	const vp = page.viewportSize()!;
	await dragTo(page, "B", vp.width * 0.7, vp.height * 0.4);
	await settled(page);

	// The row stays a row: same height, side by side with the row gap.
	const b = await center(page, "B");
	const a = await center(page, "A");
	expect(Math.abs(a.y - b.y)).toBeLessThan(4);
	const bBox = (await bubble(page, "B").boundingBox())!;
	expect(a.x - b.x).toBeGreaterThan(bBox.width);
	expect(a.x - b.x).toBeLessThan(bBox.width + 24);
});
