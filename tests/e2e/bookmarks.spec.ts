import { expect, test, type Page } from '@playwright/test';

async function openBookmarks(page: Page) {
  const rows: any[] = [];
  let failSave = false;
  const user = { id: '11111111-1111-4111-8111-111111111111', email: 'bookmark@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const token = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })).toString('base64url'), 'signature'].join('.');
  await page.addInitScript(() => sessionStorage.setItem('memory_splash_shown', '1'));
  await page.route('**/auth/v1/**', (route) => route.fulfill({ json: route.request().url().includes('/token') ? { access_token: token, refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600, user } : user }));
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const table = url.pathname.split('/').pop();
    const single = request.headers().accept?.includes('vnd.pgrst.object');
    let data: any = [];
    if (table === 'users') data = [{ dark_mode: false, profile_image: '', notification_settings: {} }];
    if (table === 'common_codes') data = [{ code: 'TECH', label: 'Tech' }, { code: 'HEALTH', label: 'Health' }, { code: 'IDEA', label: 'Idea' }];
    if (table === 'bookmarks') {
      const id = url.searchParams.get('id')?.replace('eq.', '');
      if (request.method() === 'POST') {
        if (failSave) return route.fulfill({ status: 503, json: { message: 'Connection failed' } });
        const row = { ...request.postDataJSON(), id: `bookmark-${rows.length + 1}`, created_at: '2026-09-17T01:02:03.000Z' };
        rows.unshift(row); data = [row];
      } else if (request.method() === 'PATCH') {
        const row = rows.find((entry) => entry.id === id);
        Object.assign(row, request.postDataJSON()); data = [row];
      } else if (request.method() === 'DELETE') {
        const index = rows.findIndex((entry) => entry.id === id);
        data = rows.splice(index, 1);
      } else data = rows;
    }
    await route.fulfill({ json: single ? data[0] : data });
  });
  await page.route('**/api/bookmark-metadata', (route) => route.fulfill({ json: { title: 'OG에서 읽은 제목', siteName: 'Example', description: '사이트 설명', fetchedAt: new Date().toISOString() } }));
  await page.goto('/');
  await page.getByLabel('이메일', { exact: true }).fill(user.email);
  await page.getByLabel('비밀번호', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '통합 계정으로 시작', exact: true }).click();
  await page.getByRole('button', { name: '북마크', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: '북마크', exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByText('저장된 북마크가 없습니다.').filter({ visible: true })).toBeVisible();
  return { rows, failSaves: () => { failSave = true; } };
}

test('bookmarks create, filter, search, reload, edit and delete on desktop/mobile', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const { rows } = await openBookmarks(page);
  await page.getByRole('button', { name: '북마크 등록', exact: true }).filter({ visible: true }).click();
  const form = page.getByRole('region', { name: '북마크 등록', exact: true }).filter({ visible: true });
  await form.getByLabel('URL', { exact: true }).fill('https://example.com/article');
  await form.getByLabel('URL링크분류').selectOption('HEALTH');
  await form.getByRole('button', { name: '저장', exact: true }).click();
  const card = page.locator('article').filter({ hasText: 'OG에서 읽은 제목', visible: true });
  await expect(card).toBeVisible();
  expect(rows[0].site_info.description).toBe('사이트 설명');
  expect(rows[0].title).toBe('OG에서 읽은 제목');
  await page.getByRole('button', { name: 'Tech', exact: true }).filter({ visible: true }).click();
  await expect(page.getByText('검색 조건에 맞는 북마크가 없습니다.').filter({ visible: true })).toBeVisible();
  await page.getByRole('button', { name: 'Health', exact: true }).filter({ visible: true }).click();
  await expect(card).toBeVisible();
  await page.getByRole('textbox', { name: '북마크 검색' }).filter({ visible: true }).fill('없는 검색어');
  await expect(card).toHaveCount(0);
  await page.getByRole('textbox', { name: '북마크 검색' }).filter({ visible: true }).fill('example.com');
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'OG에서 읽은 제목 수정' }).click();
  const edit = page.getByRole('region', { name: '북마크 수정', exact: true }).filter({ visible: true });
  await edit.getByLabel('TITLE').fill('직접 수정한 제목');
  await edit.getByRole('button', { name: '저장', exact: true }).click();
  expect(rows[0].created_at).toBe('2026-09-17T01:02:03.000Z');
  await expect(page.getByRole('heading', { name: '직접 수정한 제목' }).filter({ visible: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '북마크', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: '직접 수정한 제목' }).filter({ visible: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('bookmarks.png'), fullPage: true });
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '직접 수정한 제목 삭제' }).filter({ visible: true }).click();
  await expect(page.getByText('저장된 북마크가 없습니다.').filter({ visible: true })).toBeVisible();
  expect(rows).toHaveLength(0);
  expect(errors).toEqual([]);
});

test('metadata failure falls back to 무제; failed save preserves the draft', async ({ page }) => {
  const state = await openBookmarks(page);
  await page.route('**/api/bookmark-metadata', (route) => route.fulfill({ status: 422, json: { error: 'blocked' } }));
  await page.getByRole('button', { name: '북마크 등록', exact: true }).filter({ visible: true }).click();
  const form = page.getByRole('region', { name: '북마크 등록', exact: true }).filter({ visible: true });
  await form.getByLabel('URL', { exact: true }).fill('https://example.com/blocked');
  await form.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '무제', exact: true }).filter({ visible: true })).toBeVisible();
  expect(state.rows[0].title).toBe('무제');
  state.failSaves();
  await page.getByRole('button', { name: '북마크 등록', exact: true }).filter({ visible: true }).click();
  await form.getByLabel('URL', { exact: true }).fill('https://example.com/other');
  await form.getByLabel('TITLE').fill('보존할 제목');
  await form.getByRole('button', { name: '저장', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('저장하지 못했습니다');
  await expect(form.getByLabel('TITLE')).toHaveValue('보존할 제목');
  expect(state.rows).toHaveLength(1);
});

test('manual title survives metadata responses and a changed URL drops old metadata', async ({ page }) => {
  const state = await openBookmarks(page);
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/bookmark-metadata', async (route) => {
    const url = route.request().postDataJSON().url;
    if (url.endsWith('/old')) await gate;
    await route.fulfill({ json: { title: '자동 제목', siteName: url.endsWith('/old') ? 'Old site' : 'New site' } }).catch(() => {});
  });
  await page.getByRole('button', { name: '북마크 등록', exact: true }).filter({ visible: true }).click();
  const form = page.getByRole('region', { name: '북마크 등록', exact: true }).filter({ visible: true });
  await form.getByLabel('URL', { exact: true }).fill('https://example.com/old');
  const started = page.waitForRequest('**/api/bookmark-metadata');
  await form.getByRole('button', { name: '사이트 정보 가져오기', exact: true }).click();
  await started;
  await form.getByLabel('TITLE').fill('내 제목');
  await form.getByLabel('URL', { exact: true }).fill('https://example.com/new');
  release();
  await form.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('heading', { name: '내 제목', exact: true }).filter({ visible: true })).toBeVisible();
  expect(state.rows[0]).toMatchObject({ title: '내 제목', url: 'https://example.com/new', site_info: { siteName: 'New site' } });
});
