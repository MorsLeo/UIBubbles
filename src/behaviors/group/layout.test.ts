import { dockFromLanding, dockSlot, rowSlot, stackHalf } from "$src/behaviors/group/layout";
import type { BubbleSide, GroupMember } from "$src/types";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const SIZE = 56;

const fakeMember = (id: string, left = 0, top = 0, snappedSide?: BubbleSide): GroupMember => ({
	id,
	el: {
		offsetWidth: SIZE,
		offsetHeight: SIZE,
		dataset: snappedSide ? { bubbleSide: snappedSide } : {},
		getBoundingClientRect: () => ({ left, top, width: SIZE, height: SIZE })
	} as unknown as HTMLElement
});

beforeAll(() => {
	vi.stubGlobal("window", { innerWidth: 1000, innerHeight: 800 });
});

afterAll(() => {
	vi.unstubAllGlobals();
});

describe("stackHalf", () => {
	it("is zero for a single bubble", () => {
		expect(stackHalf(1)).toBe(0);
	});

	it("is half the total stack offset spread", () => {
		// 3 bubbles span 2 * 16px of offsets → 16px each side of center.
		expect(stackHalf(3)).toBe(16);
		expect(stackHalf(4)).toBe(24);
	});
});

describe("dockSlot", () => {
	const stack = [fakeMember("a"), fakeMember("b"), fakeMember("c")];

	it("rests members against the side, offset by index around the center", () => {
		// Center 400: first top = 400 - 28 (half bubble) - 16 (half spread).
		expect(dockSlot(stack[0]!, stack, 400, "right")).toEqual({ left: 932, top: 356 });
		expect(dockSlot(stack[1]!, stack, 400, "right")).toEqual({ left: 932, top: 372 });
		expect(dockSlot(stack[2]!, stack, 400, "left")).toEqual({ left: 12, top: 388 });
	});

	it("clamps the center so the whole stack keeps the edge gaps", () => {
		expect(dockSlot(stack[0]!, stack, 0, "right").top).toBe(12);
		expect(dockSlot(stack[2]!, stack, 9999, "right").top).toBe(788 - SIZE);
	});

	it("falls back to the current position before a dock center exists", () => {
		const member = fakeMember("a", 100, 200);
		expect(dockSlot(member, [member], undefined, "right")).toEqual({ left: 100, top: 200 });
	});

	it("falls back to the current position for a non-member", () => {
		const outsider = fakeMember("x", 100, 200);
		expect(dockSlot(outsider, stack, 400, "right")).toEqual({ left: 100, top: 200 });
	});
});

describe("rowSlot", () => {
	const row = [fakeMember("a"), fakeMember("b"), fakeMember("c")];

	it("centers the row along the top gap", () => {
		// 3 * 56 + 2 * 12 = 192 wide → starts at (1000 - 192) / 2.
		expect(rowSlot(row[0]!, row)).toEqual({ left: 404, top: 12 });
		expect(rowSlot(row[1]!, row)).toEqual({ left: 472, top: 12 });
		expect(rowSlot(row[2]!, row)).toEqual({ left: 540, top: 12 });
	});

	it("centers a single bubble", () => {
		const solo = fakeMember("a");
		expect(rowSlot(solo, [solo])).toEqual({ left: 472, top: 12 });
	});

	it("falls back to the current position for a non-member", () => {
		const outsider = fakeMember("x", 100, 200);
		expect(rowSlot(outsider, row)).toEqual({ left: 100, top: 200 });
	});
});

describe("dockFromLanding", () => {
	it("honors the landed member's snapped side", () => {
		const member = fakeMember("a", 800, 300, "left");
		expect(dockFromLanding(member, [member]).side).toBe("left");
	});

	it("chooses the side nearest the landing without a snap", () => {
		expect(dockFromLanding(fakeMember("a", 100, 300), [fakeMember("a")]).side).toBe("left");
		expect(dockFromLanding(fakeMember("a", 800, 300), [fakeMember("a")]).side).toBe("right");
	});

	it("derives the stack center from the member's slot", () => {
		const stack = [fakeMember("a", 932, 300), fakeMember("b"), fakeMember("c")];
		// Landing top 300 + 28 (half bubble) + 16 (half spread) - index 0 offset.
		expect(dockFromLanding(stack[0]!, stack).centerY).toBe(344);
		// One slot further down the stack subtracts one 16px offset.
		const second = [fakeMember("a"), fakeMember("b", 932, 300), fakeMember("c")];
		expect(dockFromLanding(second[1]!, second).centerY).toBe(328);
	});
});
