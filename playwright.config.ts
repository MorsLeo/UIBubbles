import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests for the interaction choreography — the drag/fling/dismiss/
 * tap-away/focus behaviour the happy-dom unit tests can't reach (no real
 * layout, pointer capture, or animation). Served from a bare fixture
 * (tests/e2e/fixture) rather than the playground, so the library tests
 * stay decoupled from demo policy.
 */
export default defineConfig({
	testDir: "./tests/e2e",
	testMatch: "**/*.spec.ts",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: "http://localhost:5174",
		trace: "on-first-retry"
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: "bunx vite --config tests/e2e/fixture.vite.ts --port 5174 --strictPort",
		url: "http://localhost:5174",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
