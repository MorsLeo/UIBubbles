import { makeKeyInteractive } from "$src/behaviors/keyboard";
import { describe, expect, it, vi } from "vitest";

const harness = () => {
	let listener: (event: KeyboardEvent) => void = () => {};
	const el = {
		addEventListener: (_: string, fn: (event: KeyboardEvent) => void) => {
			listener = fn;
		}
	} as unknown as HTMLElement;

	const handlers = {
		onActivate: vi.fn(),
		onArrow: vi.fn(),
		onEscape: vi.fn(),
		onDelete: vi.fn()
	};
	makeKeyInteractive(el, handlers);

	const press = (key: string, ctrlKey = false) => {
		const event = { key, ctrlKey, preventDefault: vi.fn() };
		listener(event as unknown as KeyboardEvent);
		return event;
	};
	return { handlers, press };
};

describe("makeKeyInteractive", () => {
	it("activates on Enter and Space", () => {
		const { handlers, press } = harness();
		press("Enter");
		press(" ");
		expect(handlers.onActivate).toHaveBeenCalledTimes(2);
	});

	it("routes each arrow with its direction", () => {
		const { handlers, press } = harness();
		press("ArrowLeft");
		press("ArrowRight");
		press("ArrowUp");
		press("ArrowDown");
		expect(handlers.onArrow.mock.calls).toEqual([
			["left", false],
			["right", false],
			["up", false],
			["down", false]
		]);
	});

	it("flags toEnd when Ctrl rides an arrow", () => {
		const { handlers, press } = harness();
		press("ArrowUp", true);
		expect(handlers.onArrow).toHaveBeenCalledWith("up", true);
	});

	it("escapes on Escape and deletes on Delete or Backspace", () => {
		const { handlers, press } = harness();
		press("Escape");
		expect(handlers.onEscape).toHaveBeenCalledTimes(1);

		press("Delete");
		press("Backspace");
		expect(handlers.onDelete).toHaveBeenCalledTimes(2);
	});

	it("prevents the default only for handled keys", () => {
		const { press } = harness();
		// Space would scroll the page, Backspace would navigate back.
		expect(press(" ").preventDefault).toHaveBeenCalled();
		expect(press("Backspace").preventDefault).toHaveBeenCalled();
	});

	it("leaves unhandled keys alone so Tab still moves focus", () => {
		const { handlers, press } = harness();
		const tab = press("Tab");
		const letter = press("a");

		expect(tab.preventDefault).not.toHaveBeenCalled();
		expect(letter.preventDefault).not.toHaveBeenCalled();
		expect(handlers.onActivate).not.toHaveBeenCalled();
		expect(handlers.onArrow).not.toHaveBeenCalled();
	});
});
