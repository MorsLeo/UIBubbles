import { defaults, ranges } from "$playground/defaults";
import type { PlaygroundConfig } from "$playground/types";

// Params are human-readable lowercase/kebab-case; values matching the
// defaults are omitted so an untouched playground keeps a bare URL.

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parseClamped = (raw: string, min: number, max: number): number | undefined => {
	const value = Number(raw);
	return Number.isFinite(value) ? clamp(value, min, max) : undefined;
};

export const readConfig = (): Partial<PlaygroundConfig> => {
	const params = new URLSearchParams(location.search);
	const config: Partial<PlaygroundConfig> = {};

	const theme = params.get("theme");
	if (theme === "auto" || theme === "dark" || theme === "light") config.theme = theme;

	const color = params.get("color");
	if (color && /^[0-9a-f]{6}$/i.test(color)) config.color = color.toLowerCase();

	const initialState = params.get("initial-state");
	if (initialState === "docked" || initialState === "open") config.initialState = initialState;

	const side = params.get("side");
	if (side === "left" || side === "right") config.side = side;

	const numbers = [
		["vertical", "vertical", ranges.vertical],
		["panel-width", "panelWidth", ranges.panelWidth],
		["panel-max-height", "panelMaxHeight", ranges.panelMaxHeight],
		["max-bubbles", "maxBubbles", ranges.maxBubbles]
	] as const;
	for (const [param, key, range] of numbers) {
		const raw = params.get(param);
		if (raw === null) continue;
		const value = parseClamped(raw, range.min, range.max);
		if (value !== undefined) config[key] = key === "vertical" ? value : Math.round(value);
	}
	return config;
};

export const writeConfig = (config: PlaygroundConfig): void => {
	const params = new URLSearchParams();
	if (config.theme !== defaults.theme) params.set("theme", config.theme);
	if (config.color) params.set("color", config.color);
	if (config.initialState !== defaults.initialState) params.set("initial-state", config.initialState);
	if (config.side !== defaults.side) params.set("side", config.side);
	if (config.vertical !== defaults.vertical) params.set("vertical", `${config.vertical}`);
	if (config.panelWidth !== defaults.panelWidth) params.set("panel-width", `${config.panelWidth}`);
	if (config.panelMaxHeight !== defaults.panelMaxHeight) {
		params.set("panel-max-height", `${config.panelMaxHeight}`);
	}
	if (config.maxBubbles !== defaults.maxBubbles) params.set("max-bubbles", `${config.maxBubbles}`);

	const query = params.toString();
	history.replaceState(null, "", query ? `?${query}` : location.pathname);
};
