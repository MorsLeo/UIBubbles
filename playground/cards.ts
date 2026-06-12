import DocsPanel from "$playground/components/docs-panel.svelte";
import DocsIcon from "$playground/components/icons/docs-icon.svelte";
import GearIcon from "$playground/components/icons/gear-icon.svelte";
import KeyboardIcon from "$playground/components/icons/keyboard-icon.svelte";
import SettingsPanel from "$playground/components/settings-panel.svelte";
import ShortcutsPanel from "$playground/components/shortcuts-panel.svelte";
import type { Card } from "$playground/types";

// Display order, left to right — on the page and in the open row. Boot
// spawns in reverse so the first card ends newest: leftmost in the row,
// active, panel showing.
export const cards: Card[] = [
	{
		id: "settings",
		title: "Settings",
		description: "Theme, position, sizing",
		panel: SettingsPanel,
		icon: GearIcon
	},
	{
		id: "docs",
		title: "Docs",
		description: "The README",
		panel: DocsPanel,
		icon: DocsIcon
	},
	{
		id: "shortcuts",
		title: "Shortcuts",
		description: "Keyboard controls",
		panel: ShortcutsPanel,
		icon: KeyboardIcon
	}
];
