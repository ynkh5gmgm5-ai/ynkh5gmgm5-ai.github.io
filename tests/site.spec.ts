import { expect, test } from '@playwright/test';

test('研究检索、筛选与详情阅读路径可用', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await page.goto('/research/');
  await expect(page.locator('.research-explorer[data-hydrated="true"]')).toBeAttached();
  await expect(page.getByText('显示 6 篇研究')).toBeVisible();
  await expect(page.locator('.research-results > li')).toHaveCount(6);

  await page.getByRole('button', { name: '产品与用户' }).click();
  await expect(page.getByText('显示 2 篇研究')).toBeVisible();

  await page.getByRole('button', { name: '全部', exact: true }).click();
  await page.getByRole('searchbox').fill('街头');
  await expect(page.getByText('显示 1 篇研究')).toBeVisible();
  await page.getByRole('link', { name: /Hi-Fi 街头试听内容与地推方案/ }).click();

  await expect(page.getByText('本地预览稿 · 未正式发布')).toBeVisible();
  await expect(page.locator('.conclusion-list > li')).toHaveCount(3);
  expect(pageErrors).toEqual([]);
});

test('移动端主导航和研究页不产生横向溢出', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', '仅在移动端项目运行');
  await page.goto('/research/');
  await expect(page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '关于', exact: true })).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
