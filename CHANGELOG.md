# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-06-13

### Added

- `panelWidth` and `panelMaxHeight` now accept a CSS string — `"<n>px"` or `"<n>%"` — alongside the
  existing px number, so a panel can size against the viewport (e.g. `panelMaxHeight: "80%"`). A
  percentage resolves live, tracking viewport resizes, while the viewport still caps the result; an
  invalid value throws at the call. Exports a `PanelLength` type for the accepted values

## [0.4.0] - 2026-06-13

### Added

- `manager.registerTrigger(el)` — mark one of your own controls (a launcher button, a menu item) as a
  trigger so a press on it is exempt from tap-away; returns a function that unregisters it. Without it,
  a control that opens or switches a bubble would collapse the flock a beat before your handler reopens
  it
- Tap-away to collapse — pressing anywhere outside the open row now collapses the group home, alongside
  tapping the active bubble and pressing Escape. The press is only a signal: it's never consumed, so
  the page behind the non-modal panel stays interactive

### Changed

- The focus ring now marks the focused bubble whatever moved focus there — mouse, keyboard, or a
  programmatic `activate()` — instead of keyboard focus (`:focus-visible`) only; the focused bubble is
  the live keyboard target, so it's always marked. Focus restores on tap rather than on grab, so
  dragging or flinging the group no longer rings a bubble

## [0.3.0] - 2026-06-12

### Added

- `manager.active()` — the id of the bubble whose panel shows while open (and that leads the row when
  it next opens); `undefined` while no bubbles are mounted
- `manager.activate(id)` — make a bubble active and bring its panel forward (expands a docked group on
  it, switches an open row to it), moving keyboard focus with it
- `manager.on(event, handler)` — subscribe to `statechange`, `activechange`, `add`, `dismiss`, and
  `remove` events; returns an unsubscribe function. Deliveries are deferred to a microtask and
  coalesced, so handlers observe a settled manager and a flicker that returns within one tick
  announces nothing
- `dismiss` event — fires the instant the user commits to dismissing a bubble (releases it on the
  target, or presses Delete), before the exit animation, so UI tracking the action stays snappy
  instead of lagging the fly-off; always followed by a matching `remove` with reason `"user"`

### Changed

- Dragging a bubble onto the dismiss target now closes the gap in the remaining bubbles and hands off
  the active panel the instant you release, instead of after the dismissed bubble finishes animating
  off-screen

## [0.2.0] - 2026-06-12

### Added

- `theme: "auto"` — follows the user's `prefers-color-scheme` and repaints live when it changes;
  pass `"dark"` or `"light"` to force a preset
- Per-bubble `panelWidth` and `panelMaxHeight` overrides on `add()`, winning over the manager's
  values and surviving `configure()` repaints
- `ricochet` manager option — the fraction of speed a flung bubble keeps when it bounces off the
  top/bottom screen gap (default `0.4`, clamped to `0–1`, retunable live via `configure()`)

### Changed

- The default theme is now `"auto"` (was `"dark"`) — pass `theme: "dark"` to keep the old default
- Re-adding a mounted bubble now refreshes its `label`, `onDismiss`, and panel sizing overrides in
  place (previously a no-op unless the bubble was mid-dismissal)

## [0.1.0] - 2026-06-12

Initial release.

### Added

- Floating, draggable bubbles that snap to screen edges with spring physics
- Group behavior: docked stack with chained trail drags, momentum flings, and a magnetic
  drag-to-dismiss target
- Expandable content panels — tap the stack to open a centered row with the active bubble's panel
- Manager API: `createBubbles()` with `add`, `remove`, `configure`, `toggle`, `state`, and `destroy`
- Theming: `dark`/`light` presets with per-token color overrides
- Options for dock side, vertical position, panel sizing, bubble cap, and initial state
- Full keyboard accessibility — single tab stop, arrow-key navigation, ARIA semantics
- `prefers-reduced-motion` support across every animation
