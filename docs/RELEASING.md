# Releasing `@hyperplexed/bubbles`

How a version gets from this repo to npm. Written to be self-contained — no prior
context needed.

## Identity

- **Package:** `@hyperplexed/bubbles` (scoped, public), living at `packages/core` of a
  bun workspace. (`packages/svelte` holds `@hyperplexed/bubbles-svelte`, not yet wired
  into the publish workflow — see the note at the bottom.)
- **Repo:** https://github.com/githyperplexed/bubbles
- **Versioning:** pre-`1.0`. Additive changes are minor bumps; the
  `packages/core/CHANGELOG.md` category (`Added` / `Changed` / `Fixed`) is the source of
  truth for what a release contains.
- **Current state:** check `npm view @hyperplexed/bubbles version` for the published
  `latest`, and `packages/core/package.json`'s `version` for what's staged locally. These can differ —
  a version bump committed to `main` is **not** published until a GitHub Release is cut
  (see below).
- **Toolchain:** Bun (package manager + script runner), Vite, TypeScript, vitest.

## The publishing model — read this first

**Publishing is GitHub-authenticated, not npm-authenticated.** There is **no npm token**
anywhere — not on any machine, not in repo secrets. A local `npm whoami` returns
`ENEEDAUTH`, by design.

The actual `npm publish` runs **inside GitHub Actions** (`.github/workflows/publish.yml`),
authenticated to npm via **Trusted Publishing (OIDC)** — a tokenless trust configured on
npmjs.com between this repo + that workflow. It also attaches a **provenance attestation**.

Consequences:

- Do **not** `npm publish` from a local machine. It would fail (no auth), and even logged
  in it would bypass provenance.
- The only capability needed to publish is the ability to **push tags and create a GitHub
  Release** (GitHub auth / the `gh` CLI).
- Publishing fires **only** on a _published GitHub Release_. Pushing a tag alone does
  **not** publish.

## Release procedure

1. **Pre-flight** — confirm green locally (the workflow re-runs these, but catch failures
   early):

   ```sh
   bun install
   bun run check     # svelte-check, 0 errors
   bun run test      # vitest
   bun run build     # builds every package's dist/ ; must succeed
   node --input-type=module -e "await import('./packages/core/dist/index.js')"   # dist resolves under bare Node ESM
   ```

2. **Bump the version** in `packages/core/package.json` (`version` field) to the target,
   e.g. `0.4.1` or `0.5.0`.

3. **Promote the changelog** in `packages/core/CHANGELOG.md`: rename `## [Unreleased]` to
   `## [X.Y.Z] - <date>` and add a fresh empty `## [Unreleased]` above it. Format is
   [Keep a Changelog](https://keepachangelog.com/).

4. **Sync the lockfile** so the workflow's `--frozen-lockfile` install can't fail:
   `bun install`, then confirm `git diff --stat bun.lock` is empty or trivial.

5. **Commit, tag, push** — the tag must point at the commit carrying the bumped version:

   ```sh
   git add packages/core/package.json packages/core/CHANGELOG.md bun.lock
   git commit -m "Release X.Y.Z"
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin main
   git push origin vX.Y.Z
   ```

6. **Create the GitHub Release — this is the publish trigger:**

   ```sh
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "<summary; the changelog section works>"
   ```

7. **Watch it publish and verify:**

   ```sh
   gh run list --workflow=publish.yml --limit 1     # get the run id
   gh run watch <run-id> --exit-status
   npm view @hyperplexed/bubbles version dist-tags.latest
   ```

## What the automation does

- **`.github/workflows/publish.yml`** — `on: release: published`, with `id-token: write`.
  Checkout → setup Bun → setup Node 24 → `npm install -g npm@latest` (Trusted Publishing
  needs npm 11.5.1+) → `bun install --frozen-lockfile` → `bun run test` → `bun run build` →
  `npm publish --provenance --access public` from `packages/core`.
- **`.github/workflows/ci.yml`** — `on: push (main)` and `pull_request`. Runs
  `check` → `test` → `build`, then verifies `packages/core/dist/index.js` imports cleanly
  under bare Node ESM (guards SSR consumers).
- **each package's `prepublishOnly`** — re-runs the root `check` + `test` gate and its own
  build, a backstop for any publish path that skips the workflow.

## Gotchas

- **Tag push ≠ publish.** You must create the GitHub Release.
- **`package.json` `version` must match the tag** — the workflow publishes whatever version
  is in the checked-out tag.
- **Lockfile must be in sync**, or `--frozen-lockfile` aborts the run.
- **Only a package's `files` list is published** (`dist/` plus non-test `src/`); the
  playground and e2e tests never ship.
- **A published version can't be overwritten.** If a release is botched, bump to the next
  patch — npm forbids re-publishing the same version.
- **If `npm publish` fails on auth/OIDC in the workflow**, the npm Trusted Publisher config
  on npmjs.com doesn't match this repo + workflow. Fix it in the package settings on
  npmjs.com (web UI) — it isn't controlled by the workflow or local environment.
- On Windows, Git's `LF will be replaced by CRLF` warnings on `bun.lock` / `package.json`
  are harmless.
- **`@hyperplexed/bubbles-svelte` is not published yet.** Before its first release: create
  the package on npmjs.com with a Trusted Publisher config matching this repo + workflow,
  then uncomment its publish step in `publish.yml`. Its `dependencies` pin
  `@hyperplexed/bubbles` by semver range (not `workspace:`), so `npm publish` needs no
  rewriting.
