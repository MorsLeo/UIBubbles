# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
