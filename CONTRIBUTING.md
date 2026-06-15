# Contributing

Thanks for your interest in **@hyperplexed/bubbles**.

A note on scope first: this project is maintained **as-is**, by one person, in spare time. It's source-available and shared in the hope it's useful — but it is not a community-run project with guaranteed support, response times, or a roadmap. With that framing, here's what's welcome.

## Reporting bugs

Open an issue with the **Bug report** template. A minimal reproduction is the single biggest factor in whether a bug gets fixed — reports without one may be closed. Include the version, the browser/OS, and the smallest steps or link that reproduce the problem.

## Feature requests and ideas

Open an issue with the **Feature request** template. Ideas are genuinely welcome and read, but please treat them as suggestions, not commitments: most won't be built, and that's about bandwidth, not the idea.

## Pull requests

Small, focused PRs — typo fixes, doc improvements, small bug fixes — are welcome and appreciated.

For anything larger (new features, refactors, API changes), **open an issue first** to agree on the shape. Large or unsolicited PRs may not be reviewed or merged, and I'd rather you not spend the effort before we've talked it through.

If you do send a PR:

- Keep it focused on a single change.
- Run `bun run check`, `bun run test`, and `bun run format` before pushing (CI runs the first two plus the build and an e2e pass).
- Match the surrounding style — the repo is Prettier-formatted and pins LF line endings via `.gitattributes`.

## Local development

```sh
bun install
bun run dev        # playground at the Vite dev URL
bun run check      # types (svelte-check)
bun run test       # unit tests (vitest)
bun run test:e2e   # browser tests (Playwright)
```

See the [Development](README.md#development) section of the README for the full script list.

## Security

Please don't open public issues for security problems — see [SECURITY.md](SECURITY.md).
