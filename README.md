# Bubbles

Android-style app bubbles for the web — floating, draggable, expandable overlay bubbles. Zero-dependency core over the plain DOM, with framework wrappers on top.

**Docs & demo:** https://bubbles.hyperplexed.io

## Packages

| Package                                          | Path              | What it is                                                              |
| ------------------------------------------------ | ----------------- | ----------------------------------------------------------------------- |
| [`@hyperplexed/bubbles`](packages/core)          | `packages/core`   | The library — vanilla TypeScript, framework-agnostic, zero dependencies |
| [`@hyperplexed/bubbles-svelte`](packages/svelte) | `packages/svelte` | Svelte 5 wrapper — declarative `<Bubbles>`/`<Bubble>` components        |

Start with the [core README](packages/core/README.md) for the full API, theming, accessibility, and behavior docs. React and Vue wrappers are planned; the core's render-callback slots already support any framework directly.

## Development

The repo is a bun workspace: publishable packages under `packages/`, with the playground site (`playground/`, `index.html`) and Playwright e2e suite (`tests/`) at the root. All commands run from the repo root:

```sh
bun install
bun run dev        # playground at the Vite dev URL
bun run check      # svelte-check over the whole repo
bun run test       # vitest unit tests (all packages + playground)
bun run test:e2e   # Playwright browser tests (Chromium/Firefox/WebKit + mobile)
bun run build      # every package's build to its dist/
bun run build:site # playground build to dist-site/
```

Releases are documented in [docs/RELEASING.md](docs/RELEASING.md).

## Contributing & support

Bubbles is source-available and maintained as-is, by one person, in spare time. Bug reports and ideas are welcome via [issues](https://github.com/githyperplexed/bubbles/issues), and small, focused PRs are too — but there's no guaranteed support or response. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request, and report security issues privately per [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
