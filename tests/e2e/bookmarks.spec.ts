import { expect, test, type Page } from '@playwright/test';

async function openBookmarks(page: Page) {
  const rows: any[] = [];
  const codes: any[] = [
    { code_group: 'BOOKMARK_CATEGORY', code: 'TECH', label: 'Tech', sort_order: 10, is_active: true },
    { code_group: 'BOOKMARK_CATEGORY', code: 'HEALTH', label: 'Health', sort_order: 20, is_active: true },
    { code_group: 'BOOKMARK_CATEGORY', code: 'IDEA', label: 'Idea', sort_order: 30, is_active: true },
  ];
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
    if (table === 'common_codes') {
      const code = url.searchParams.get('code')?.replace('eq.', '');
      if (request.method() === 'POST') {
        const row = request.postDataJSON();
        if (codes.some((entry) => entry.code === row.code)) return route.fulfill({ status: 409, json: { code: '23505', message: 'duplicate key value' } });
        codes.push(row); data = [row];
      } else if (request.method() === 'PATCH') {
        const row = codes.find((entry) => entry.code === code);
        Object.assign(row, request.postDataJSON()); data = [row];
      } else data = [...codes].sort((first, second) => first.sort_order - second.sort_order);
    }
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
  return { rows, codes, failSaves: () => { failSave = true; } };
}

// 모바일 레이아웃은 북마크 탭에 사이드바가 없어 메모 탭에서 설정을 연다.
async function openCategorySettings(page: Page) {
  const settings = page.getByRole('button', { name: '설정', exact: true }).filter({ visible: true });
  if (!(await settings.count())) await page.getByRole('button', { name: '메모', exact: true }).filter({ visible: true }).click();
  await settings.first().click();
  await page.getByRole('button', { name: 'URL링크분류 관리', exact: true }).click();
}

async function saveCategoryRow(page: Page, code: string) {
  await page.getByRole('form', { name: `${code} 분류`, exact: true }).getByRole('button', { name: '저장', exact: true }).click();
}

async function backToBookmarks(page: Page) {
  await page.getByRole('button', { name: '설정 닫기', exact: true }).click();
  await page.getByRole('button', { name: '북마크', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: '북마크', exact: true }).filter({ visible: true })).toBeVisible();
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

test('bookmark categories are added, renamed and deactivated from the settings screen', async ({ page }) => {
  const state = await openBookmarks(page);
  await openCategorySettings(page);
  await expect(page.getByLabel('TECH 표시 이름')).toHaveValue('Tech');

  // 추가한 분류가 북마크 등록 화면의 선택지와 필터에 바로 나온다.
  await page.getByLabel('추가할 분류 코드').fill('travel');
  await page.getByLabel('추가할 분류 표시 이름').fill('여행');
  await page.getByRole('button', { name: '분류 추가', exact: true }).click();
  await expect(page.getByLabel('TRAVEL 표시 이름')).toHaveValue('여행');
  expect(state.codes.at(-1)).toMatchObject({ code_group: 'BOOKMARK_CATEGORY', code: 'TRAVEL', label: '여행', sort_order: 40, is_active: true });

  // 코드값은 그대로 두고 표시 이름과 순서만 바꾼다.
  await page.getByLabel('TECH 표시 이름').fill('기술');
  await page.getByLabel('TECH 정렬 순서').fill('5');
  await saveCategoryRow(page, 'TECH');
  await expect(page.getByRole('status').filter({ hasText: '‘기술’ 분류를 저장했습니다.' })).toBeVisible();

  // 비활성화한 분류는 새 북마크에서 고를 수 없다.
  await page.getByRole('switch', { name: 'IDEA 사용 여부' }).click();
  await saveCategoryRow(page, 'IDEA');
  await expect(page.getByRole('status').filter({ hasText: '‘Idea’ 분류를 저장했습니다.' })).toBeVisible();
  expect(state.codes.find((entry) => entry.code === 'IDEA')).toMatchObject({ is_active: false });
  expect(state.codes.find((entry) => entry.code === 'TECH')).toMatchObject({ code: 'TECH', label: '기술', sort_order: 5 });

  await backToBookmarks(page);
  await page.getByRole('button', { name: '북마크 등록', exact: true }).filter({ visible: true }).click();
  const form = page.getByRole('region', { name: '북마크 등록', exact: true }).filter({ visible: true });
  await expect(form.getByLabel('URL링크분류').locator('option')).toHaveText(['기술', 'Health', '여행']);
  await form.getByLabel('URL', { exact: true }).fill('https://example.com/travel');
  await form.getByLabel('URL링크분류').selectOption('TRAVEL');
  await form.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.locator('article').filter({ hasText: 'OG에서 읽은 제목', visible: true })).toBeVisible();
  expect(state.rows[0].category_code).toBe('TRAVEL');
});

test('a deactivated category keeps its label and filter on bookmarks already saved with it', async ({ page }) => {
  const state = await openBookmarks(page);
  await page.getByRole('button', { name: '북마크 등록', exact: true }).filter({ visible: true }).click();
  const form = page.getByRole('region', { name: '북마크 등록', exact: true }).filter({ visible: true });
  await form.getByLabel('URL', { exact: true }).fill('https://example.com/idea');
  await form.getByLabel('URL링크분류').selectOption('IDEA');
  await form.getByRole('button', { name: '저장', exact: true }).click();
  const card = page.locator('article').filter({ hasText: 'OG에서 읽은 제목', visible: true });
  await expect(card).toBeVisible();

  await openCategorySettings(page);
  await page.getByRole('switch', { name: 'IDEA 사용 여부' }).click();
  await saveCategoryRow(page, 'IDEA');
  await expect(page.getByRole('status').filter({ hasText: '분류를 저장했습니다.' })).toBeVisible();
  await backToBookmarks(page);

  // 저장된 북마크는 분류 이름과 필터를 유지하고, 새 등록 화면에서만 사라진다.
  await expect(card.getByText('Idea', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Idea', exact: true }).filter({ visible: true }).click();
  await expect(card).toBeVisible();
  await page.getByRole('button', { name: '전체', exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: '북마크 등록', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('region', { name: '북마크 등록', exact: true }).filter({ visible: true }).getByLabel('URL링크분류').locator('option')).toHaveText(['Tech', 'Health']);
  expect(state.rows[0].category_code).toBe('IDEA');
});
