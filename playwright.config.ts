import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    ...devices["Pixel 7"],
    // The interface follows the device language (Hindi on a Hindi phone); keep these runs in English.
    locale: "en-US",
    baseURL: `http://localhost:${port}`,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    env: { FAKE_AI: "1" },
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
});
