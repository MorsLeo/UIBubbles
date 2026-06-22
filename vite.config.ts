import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";

// Inject the umami tracker into the playground site only when the build
// environment defines both vars (e.g. the Cloudflare Pages project). Local
// builds and forks have neither, so they ship no tracker — and no analytics
// URL or website id lives in the repo.
const umami = (env: Record<string, string>): Plugin => ({
	name: "inject-umami",
	transformIndexHtml() {
		const src = env.VITE_UMAMI_SCRIPT_URL;
		const id = env.VITE_UMAMI_WEBSITE_ID;
		if (!src || !id) return;
		return [
			{
				tag: "script",
				attrs: { defer: true, src, "data-website-id": id },
				injectTo: "head"
			}
		];
	}
});

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "VITE_");
	return {
		plugins: [svelte(), tailwindcss(), umami(env)],
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
		// Unit tests live under src/ and playground/. The e2e *.spec.ts files run
		// under Playwright, not vitest, so keep them out of this glob.
		test: {
			include: ["src/**/*.test.ts", "playground/**/*.test.ts"]
		}
	};
});
