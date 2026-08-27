import { defineConfig, devices } from '@playwright/test';

/**
 * @brief Playwright E2E 配置
 * @desc testDir 指向 tests/e2e；webServer 自动拉起 vite dev server（5173），
 *       reuseExistingServer 允许复用已存在的 dev 实例
 * @note desktop-chrome 直接用 chromium（仅需 `npx playwright install chromium`）；
 *       mobile-iphone 依赖 webkit，未安装时该 project 会失败，可单独跑 desktop-chrome
 */
export default defineConfig({
    testDir: './tests/e2e',
    use: { baseURL: 'http://localhost:5173' },
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 60_000,
    },
    projects: [
        { name: 'desktop-chrome', use: { browserName: 'chromium' } },
        { name: 'mobile-iphone', use: { ...devices['iPhone 13'] } },
    ],
});
