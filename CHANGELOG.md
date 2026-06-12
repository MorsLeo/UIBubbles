# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
