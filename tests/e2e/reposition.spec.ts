import { expect, test } from "@playwright/test";
import { bubble, dragTo, settled } from "./helpers";

// Fork change (MorsLeo/UIBubbles): the open row is no longer pinned to the
// top center. Dragging an open bubble moves the row — its landing becomes
// the row's new anchor, the other bubbles reflow around it, and the panel
// follows, flipping above the row when the bottom runs out of room.

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.waitForFunction(() => !!window.bubbles);
});

const center = async (page: import("@playwright/test").Page, label: string) => {
	const box = await bubble(page, label).boundingBox();
	if (!box) throw new Error(`no box for "${label}"`);
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test("an open bubble docks where it is dropped and keeps its panel", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "Panel A" });
		window.bubbles.activate("a");
	});
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await settled(page);

	const vp = page.viewportSize()!;
	const target = { x: vp.width * 0.25, y: vp.height * 0.55 };
	await dragTo(page, "A", target.x, target.y);
	await settled(page);

	// Still open, resting near the drop point instead of the top center.
	expect(await page.evaluate(() => window.bubbles.state())).toBe("open");
	const at = await center(page, "A");
	expect(Math.abs(at.x - target.x)).toBeLessThan(60);
	expect(Math.abs(at.y - target.y)).toBeLessThan(60);

	// The panel comes back once the bubble settles, adjacent to it.
	const panel = page.locator('[data-panel-content="a"]');
	await expect(panel).toBeVisible();
	const panelBox = (await panel.boundingBox())!;
	const bubbleBox = (await bubble(page, "A").boundingBox())!;
	expect(panelBox.y).toBeGreaterThan(bubbleBox.y + bubbleBox.height);
});

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

test("the panel flips above the row when it is dropped near the bottom", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "Panel A" });
		window.bubbles.activate("a");
	});
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await settled(page);

	const vp = page.viewportSize()!;
	await dragTo(page, "A", vp.width / 2, vp.height - 40);
	await settled(page);

	const panel = page.locator('[data-panel-content="a"]');
	await expect(panel).toBeVisible();
	const panelBox = (await panel.boundingBox())!;
	const bubbleBox = (await bubble(page, "A").boundingBox())!;

	// No room below the row: the panel sits fully above the bubble and
	// stays on screen.
	expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(bubbleBox.y + 1);
	expect(panelBox.y).toBeGreaterThanOrEqual(0);
});

test("a collapsed and reopened flock keeps the taught row spot", async ({ page }) => {
	await page.evaluate(() => {
		window.bubbles.create();
		window.bubbles.add({ id: "a", label: "A", panelText: "A" });
		window.bubbles.activate("a");
	});
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await settled(page);

	const vp = page.viewportSize()!;
	const target = { x: vp.width * 0.3, y: vp.height * 0.5 };
	await dragTo(page, "A", target.x, target.y);
	await settled(page);

	await page.evaluate(() => window.bubbles.toggle());
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("docked");
	await settled(page);

	await page.evaluate(() => window.bubbles.toggle());
	await expect.poll(() => page.evaluate(() => window.bubbles.state())).toBe("open");
	await settled(page);

	const at = await center(page, "A");
	expect(Math.abs(at.x - target.x)).toBeLessThan(60);
	expect(Math.abs(at.y - target.y)).toBeLessThan(60);
});
