# @hyperplexed/bubbles

Android-style app bubbles for the web. Floating, draggable bubbles that snap to screen edges, stack into a group, expand into content panels, and fling to dismiss — an overlay for any website.

![Bubbles being dragged across the screen, flung to an edge, expanded into panels, and dismissed](https://raw.githubusercontent.com/githyperplexed/bubbles/main/.github/demo.gif)

- **Zero dependencies, framework-agnostic** — plain TypeScript over the DOM; works with anything, ships nothing else
- **Real physics** — spring glides, momentum flings, chained trail drags, a magnetic dismiss target
- **Fully keyboard accessible** — single tab stop, arrow-key navigation, ARIA semantics throughout
- **Respects `prefers-reduced-motion`** — every animation has a calm equivalent
- **Customizable** — dark/light themes with per-token color overrides, dock position, panel sizing

## Install

```sh
bun add @hyperplexed/bubbles
# or: npm install @hyperplexed/bubbles
```

## Quick start

```ts
import { createBubbles } from "@hyperplexed/bubbles";

const manager = createBubbles();

const content = document.createElement("div");
content.textContent = "Hello from the panel!";

manager.add({
	id: "chat",
	label: "Chat support",
	content
});
```

That's a working bubble: drag it anywhere and it snaps to the nearest edge, tap it to expand the panel, drag it onto the target at the bottom of the screen to dismiss it.

## API

### `createBubbles(options?)`

Creates a manager. Touches no DOM until the first `add()`, so it's safe to construct during app setup (browser only — there is no SSR rendering to do).

| Option           | Type                   | Default    | Description                                                                                                                          |
| ---------------- | ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `theme`          | `"dark" \| "light"`    | `"dark"`   | Preset color scheme, named for the host page it suits. `"dark"` pairs a bright bubble with a dark panel; `"light"` inverts it.       |
| `colors`         | `Partial<BubbleTheme>` | —          | Per-token color overrides applied on top of the preset. See [Theming](#theming).                                                     |
| `side`           | `"left" \| "right"`    | `"right"`  | Screen edge the docked stack starts on. Users can drag it anywhere afterward; with `configure()` it applies to the next fresh entry. |
| `vertical`       | `number`               | `0.5`      | Vertical center of the docked stack as a fraction of the viewport height (`0` top, `1` bottom), clamped to the screen margins.       |
| `panelWidth`     | `number`               | `480`      | Expanded panel width in px. The viewport always caps it.                                                                             |
| `panelMaxHeight` | `number`               | —          | Cap on the panel height in px. Without it the panel may use the full height under the bubble row.                                    |
| `maxBubbles`     | `number`               | `5`        | Most bubbles the manager will hold; `add()` returns `false` beyond it.                                                               |
| `initialState`   | `"docked" \| "open"`   | `"docked"` | The state a fresh flock enters in. `"open"` drops every bubble straight into its row slot — never docked-then-risen.                 |

```ts
const manager = createBubbles({
	theme: "light",
	colors: { bubbleSurface: "#7c3aed", bubbleIcon: "#ffffff" },
	side: "left",
	vertical: 0.33,
	panelWidth: 420,
	panelMaxHeight: 600,
	maxBubbles: 3
});
```

### `manager.add(options)`

Mounts a bubble. It flies in from the docked side and joins the group. Re-adding an id whose dismissal is still animating reverses the exit. Returns `true` when the bubble is present after the call (newly added, already mounted, or reclaimed mid-dismissal) and `false` only when the manager is at `maxBubbles` and the request was ignored. Bubbles still animating out after `remove()` don't count toward the cap, so an evict-then-add swap works in one tick.

| Option      | Type          | Description                                                                                                                     |
| ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | `string`      | Unique id for this bubble (required).                                                                                           |
| `label`     | `string`      | Accessible name for the bubble and its panel, e.g. `"Chat support"`. Without it the bubble announces as a generic button.       |
| `icon`      | `HTMLElement` | Content shown inside the collapsed bubble (an avatar, an SVG, anything). Defaults to a chat glyph.                              |
| `content`   | `HTMLElement` | Content shown in the expanded panel. Without it the bubble has no panel.                                                        |
| `onDismiss` | `() => void`  | Fires after the _user_ dismisses the bubble (drag onto the target, or Delete on the keyboard). Not fired by `manager.remove()`. |

### `manager.remove(id)`

Programmatic removal — animates the bubble off-screen, then unmounts it. Does **not** fire `onDismiss` (that's reserved for user-initiated dismissal, so you can mirror state without loops).

### `manager.configure(options)`

Applies new options to the live manager — no remounting, no re-entry animations. Theme and colors repaint every bubble, panel, and the dismiss target in place; panel sizing reflows open panels; a changed `maxBubbles` governs future `add()` calls (a lower cap never evicts live bubbles). `side`, `vertical`, and `initialState` describe how a fresh flock enters, so they take effect once every bubble is gone and the next one enters (or on the next page load). Omitted options return to their defaults, same as `createBubbles`.

One boundary to know: elements _you_ supplied (`icon`, `content`) are yours — the library never restyles them, so react to your own theme state there.

```ts
// e.g. follow the host page's dark-mode toggle:
darkModeToggle.addEventListener("change", () => {
	manager.configure({ theme: darkModeToggle.checked ? "dark" : "light" });
});
```

### `manager.toggle()`

Expands or collapses the group, moving keyboard focus with it. Bind this to your own shortcut — the library ships no global hotkey, so it can never collide with your page's.

### `manager.state()`

The flock's current arrangement: `"docked"` (stacked on a screen edge) or `"open"` (the top row, panel showing). With no bubbles mounted, returns the state the next flock will enter in — the configured `initialState`. Useful for host chrome that reacts to the overlay, e.g. dimming the page while the row is open.

### `manager.destroy()`

Removes every bubble, panel, and listener immediately. Call when the host view unmounts.

## Theming

Pick a preset, then override any token via `colors`:

```ts
import { bubbleThemes, createBubbles } from "@hyperplexed/bubbles";

const manager = createBubbles({
	theme: "light",
	colors: { bubbleSurface: "#0ea5e9", focusRing: "#0ea5e9" }
});

// Presets are exported, so overrides can build on their values:
bubbleThemes.light.panelSurface; // "#ffffff"
```

Every token the library paints with:

| Token            | Paints                                                               |
| ---------------- | -------------------------------------------------------------------- |
| `bubbleSurface`  | Fill of the collapsed bubble circle                                  |
| `bubbleIcon`     | Stroke of the built-in chat glyph (only when a bubble has no `icon`) |
| `bubbleShadow`   | Drop shadow under each bubble                                        |
| `focusRing`      | Ring marking the keyboard-focused bubble                             |
| `panelSurface`   | Fill of the expanded panel and its caret                             |
| `panelText`      | Default text color inside the panel                                  |
| `panelShadow`    | Drop shadow under the panel                                          |
| `dismissSurface` | Fill of the drag-to-dismiss target circle                            |
| `dismissBorder`  | Border of the dismiss target circle                                  |
| `dismissIcon`    | Stroke of the X inside the dismiss target                            |

Inside the panel, `content` is your element — style it however you like; only `panelText` cascades in as a default.

## Icons and content

Both `icon` and `content` are plain `HTMLElement`s, which keeps the library framework-agnostic. Vanilla:

```ts
const icon = document.createElement("img");
icon.src = "/avatar.png";
icon.style.cssText = "width: 100%; height: 100%; border-radius: 50%; object-fit: cover;";
```

From a framework, render into a detached element and pass it. Svelte 5:

```ts
import { mount } from "svelte";
import ChatPanel from "./chat-panel.svelte";

const content = document.createElement("div");
mount(ChatPanel, { target: content });
manager.add({ id: "chat", label: "Chat", content });
```

React:

```tsx
import { createRoot } from "react-dom/client";

const content = document.createElement("div");
createRoot(content).render(<ChatPanel />);
manager.add({ id: "chat", label: "Chat", content });
```

The panel surface handles clipping, rounding, and the height constraint; give your content its own scrolling regions rather than relying on an outer scrollbar.

## Behavior

- **Docked**, bubbles stack on a screen edge and move as one: drag any of them and the rest chase in a trail, fling the group and it coasts to an edge, drop it on the dismiss target to dismiss them all.
- **Tap** the stack and it expands into a centered row along the top, with the active bubble's panel below. Tap another bubble to switch panels; tap the active bubble (or press Escape) to collapse home.
- **Dismiss target** appears at the bottom of the screen during any drag; it leans toward the cursor and magnetically captures the bubble when close.
- The newest bubble always becomes the active one; collapsing reorders the most recently used bubble to the top of the stack.

## Keyboard and accessibility

The whole group is a single tab stop. The docked stack announces as one button; the open row announces one button per bubble.

| Key                    | Docked stack                               | Open row                                   |
| ---------------------- | ------------------------------------------ | ------------------------------------------ |
| `Enter` / `Space`      | Expand the group                           | Switch to this bubble / collapse if active |
| `←` / `→`              | Send the stack to the other edge           | Move focus between bubbles                 |
| `↑` / `↓`              | Scoot the stack (with `Ctrl`: all the way) | —                                          |
| `Delete` / `Backspace` | —                                          | Dismiss the focused bubble                 |
| `Escape`               | —                                          | Collapse and return focus to the stack     |

Panels are non-modal dialogs (`role="dialog"`, labelled by the bubble's `label`, wired via `aria-controls`/`aria-expanded`); the host page stays reachable behind them. The dismiss target is pointer-only decoration and hidden from assistive tech — keyboard dismissal has its own path. All motion honors `prefers-reduced-motion` with fades in place of flights.

## Notes

- Bubbles render at the top of the stacking order (`z-index` near max). If your page also uses extreme z-indexes, bubbles paint above panels by design — a dragged bubble slides over its fading panel, never behind it.
- Pointer Events and the Web Animations API are required — i.e., all evergreen browsers.
- The package ships ESM with type declarations; `sideEffects: false` keeps it tree-shakeable.

## Development

```sh
bun install
bun run dev        # playground at the Vite dev URL
bun run test       # vitest unit tests
bun run build      # library build to dist/
bun run build:site # playground build to dist-site/
```

The repo holds the library (`src/`) and a Svelte playground (`playground/`); only `dist/` is published.

## License

[MIT](LICENSE)
