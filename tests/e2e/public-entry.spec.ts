import { expect, test } from '@playwright/test';

test('renders the public entry without layout or runtime errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');

  await expect(page).toHaveTitle('MEMOry');
  await expect(page.getByRole('heading', { name: 'MEMOry' })).toBeVisible();
  await expect(page.getByLabel('이메일')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel('비밀번호')).toBeVisible();
  await expect(page.getByRole('button', { name: '통합 계정으로 시작' })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
  expect(pageErrors).toEqual([]);
});

test('keeps the archive content slot vertically scrollable', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(() => {
    const root = document.querySelector('#root');
    if (!root) return null;

    root.innerHTML = `
      <div style="height: 100vh; overflow: hidden;">
        <div
          data-testid="archive-scroll-container"
          class="min-h-0 overflow-y-auto overscroll-contain custom-scrollbar"
          style="height: 100%;"
        >
          <main style="height: 2000px;"></main>
        </div>
      </div>
    `;

    const container = root.querySelector('[data-testid="archive-scroll-container"]');
    if (!(container instanceof HTMLElement)) return null;
    container.scrollTop = 500;

    return {
      clientHeight: container.clientHeight,
      overflowY: getComputedStyle(container).overflowY,
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    };
  });

  expect(result).not.toBeNull();
  expect(result?.overflowY).toBe('auto');
  expect(result?.scrollHeight).toBeGreaterThan(result?.clientHeight || 0);
  expect(result?.scrollTop).toBeGreaterThan(0);
});
