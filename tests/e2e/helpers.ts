import { type Page } from "@playwright/test";

/** Locator for a mounted bubble by its accessible name (the `label`). */
export const bubble = (page: Page, label: string) =>
	page.locator(`[role="button"][aria-label="${label}"]`);

/** The accessible name of whatever's focused — the suite's single-tab-stop probe. */
export const focusedLabel = (page: Page): Promise<string | null> =>
	page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? null);

/**
 * Drags a bubble onto the dismiss target with a real pointer. Moves to the
 * bottom-center where the target rests (well inside its capture radius on a
 * desktop viewport), in steps so the velocity tracker and the target's
 * capture both see the motion, then releases.
 */
export const dragToDismiss = async (page: Page, label: string): Promise<void> => {
	const box = await bubble(page, label).boundingBox();
	const vp = page.viewportSize();
	if (!box || !vp) throw new Error(`cannot drag "${label}": no box/viewport`);

	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.mouse.move(vp.width / 2, vp.height - 60, { steps: 24 });
	await page.mouse.move(vp.width / 2, vp.height - 56, { steps: 4 });
	await page.mouse.up();
};

/**
 * Resolves once every bubble has held its position for a few consecutive
 * animation frames — the black-box settle the suite waits on instead of
 * fixed timeouts. Polls per rAF; a continuously-running loop (a never-
 * arriving glide) makes it time out rather than hang.
 */
export const settled = async (page: Page, timeout = 4000): Promise<void> => {
	await page.evaluate(() => {
		(window as unknown as { __settle?: unknown }).__settle = { prev: "", stable: 0 };
	});
	await page.waitForFunction(
		() => {
			const state = (window as unknown as { __settle: { prev: string; stable: number } })
				.__settle;
			const snapshot = [...document.querySelectorAll('[role="button"][aria-label]')]
				.map((el) => {
					const r = el.getBoundingClientRect();
					return `${Math.round(r.left)},${Math.round(r.top)}`;
				})
				.join("|");
			if (snapshot === state.prev) state.stable += 1;
			else {
				state.prev = snapshot;
				state.stable = 0;
			}
			return state.stable >= 3;
		},
		undefined,
		{ timeout, polling: "raf" }
	);
};
