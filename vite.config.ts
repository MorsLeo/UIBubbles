import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	build: {
		// The playground site; "dist" is reserved for the library build.
		outDir: "dist-site"
	},
	resolve: {
		alias: {
			$src: fileURLToPath(new URL("./src", import.meta.url)),
			$playground: fileURLToPath(new URL("./playground", import.meta.url))
		}
	},
	// Unit tests are src/**/*.test.ts. The e2e *.spec.ts files run under
	// Playwright, not vitest, so keep them out of this glob.
	test: {
		include: ["src/**/*.test.ts"]
	}
});
