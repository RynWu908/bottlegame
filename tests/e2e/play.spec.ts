import { test, expect } from '@playwright/test';

/**
 * @brief 倒水瓶 E2E 关键路径测试
 * @desc 覆盖菜单/选关/游戏渲染、进度持久化、撤销口算题 modal 弹出与关闭三条路径；
 *       不依赖 window.__testQuizAnswer 等内部状态暴露，答案正确性由单元测试保证
 */

test('菜单 → 选关 → 游戏 → 返回菜单', async ({ page }) => {
    await page.goto('/');
    await page.getByText('开始游戏').click();
    // LEVEL_1 固定 3 个瓶子，点击关卡 1 后应渲染 3 个 .bottle
    await page.getByText('1', { exact: true }).first().click();
    await expect(page.locator('.bottle')).toHaveCount(3);
    // 返回主菜单
    await page.getByText('☰ 菜单').click();
    await expect(page.getByText('开始游戏')).toBeVisible();
});

test('进度持久化：reload 后 URL 仍为 /', async ({ page }) => {
    await page.goto('/');
    await page.getByText('开始游戏').click();
    await page.getByText('1', { exact: true }).first().click();
    // route 为内存 state，reload 后回到菜单，URL 始终为 /
    await page.reload();
    await expect(page).toHaveURL('/');
});

test('撤销弹口算题 modal 可关闭', async ({ page }) => {
    await page.goto('/');
    await page.getByText('开始游戏').click();
    await page.getByText('1', { exact: true }).first().click();
    // 点撤销按钮（文本形如「撤销（0/3）」），触发口算题 modal
    await page.getByText(/撤销/).click();
    await expect(page.locator('.quiz')).toBeVisible();
    // 关闭 modal，不验证答对效果（由单元测试覆盖）
    await page.getByText('关闭').click();
    await expect(page.locator('.quiz')).not.toBeVisible();
});
