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
	projects: [
		// Desktop engines run the full suite except the touch-only spec.
		{ name: "chromium", testIgnore: /mobile\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", testIgnore: /mobile\.spec\.ts/, use: { ...devices["Desktop Firefox"] } },
		{ name: "webkit", testIgnore: /mobile\.spec\.ts/, use: { ...devices["Desktop Safari"] } },
		// Mobile devices (real touch + small viewport) run only the tap-driven
		// spec — drag gestures need a CDP touch helper and are out of scope here.
		{ name: "mobile-chrome", testMatch: /mobile\.spec\.ts/, use: { ...devices["Pixel 7"] } },
		{ name: "mobile-safari", testMatch: /mobile\.spec\.ts/, use: { ...devices["iPhone 14"] } }
	],
	webServer: [
		{
			command: "bunx vite --config tests/e2e/fixture.vite.ts --port 5174 --strictPort",
			url: "http://localhost:5174",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000
		},
		{
			command: "bunx vite --port 5173 --strictPort",
			url: "http://localhost:5173",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000
		}
	]
});
