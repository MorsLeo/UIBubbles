import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/**
 * Serves the bare e2e fixture for Playwright. Only the `$src` alias is
 * needed — the library is plain DOM/TS, so there's no Svelte or Tailwind
 * here, unlike the playground's config. Named off the `vite.config.*`
 * pattern on purpose, so svelte-check's config discovery skips it.
 */
export default defineConfig({
	root: fileURLToPath(new URL("./fixture", import.meta.url)),
	resolve: {
		alias: {
			$src: fileURLToPath(new URL("../../packages/core/src", import.meta.url))
		}
	}
});
