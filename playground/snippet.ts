import { AUTO_PANEL_MAX_HEIGHT, defaults } from "$playground/defaults";
import { accentColors } from "$playground/options";
import type { PlaygroundConfig } from "$playground/types";

/**
 * The current configuration as the consumer code that produces it,
 * listing only the options that differ from the defaults.
 */
export const configSnippet = (config: PlaygroundConfig): string => {
	const lines: string[] = [];
	if (config.theme !== defaults.theme) lines.push(`\ttheme: "${config.theme}"`);
	if (config.color) {
		const colors = accentColors(config.color);
		const tokens = Object.entries(colors)
			.map(([token, value]) => `${token}: "${value}"`)
			.join(", ");
		lines.push(`\tcolors: { ${tokens} }`);
	}
	if (config.side !== defaults.side) lines.push(`\tside: "${config.side}"`);
	if (config.vertical !== defaults.vertical) lines.push(`\tvertical: ${config.vertical}`);
	if (config.panelWidth !== defaults.panelWidth) {
		lines.push(`\tpanelWidth: ${config.panelWidth}`);
	}
	if (config.panelMaxHeight !== AUTO_PANEL_MAX_HEIGHT) {
		lines.push(`\tpanelMaxHeight: ${config.panelMaxHeight}`);
	}
	if (config.maxBubbles !== defaults.maxBubbles) lines.push(`\tmaxBubbles: ${config.maxBubbles}`);

	if (lines.length === 0) return "createBubbles();";
	return `createBubbles({\n${lines.join(",\n")}\n});`;
};
