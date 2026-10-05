import { expect, test, type Page } from '@playwright/test';

const pad = (value: number) => String(value).padStart(2, '0');
const dateString = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

async function openMobileCalendar(page: Page) {
  const today = new Date();
  const user = { id: '22222222-2222-4222-8222-222222222222', email: 'calendar@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const token = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })).toString('base64url'), 'signature'].join('.');
  const schedule = (id: string, title: string, day: Date, priority: string) => ({
    id, title, date_string: dateString(day), all_day: false, start_time: '10:00', end_time: '11:00', priority,
    memo: null, recurrence: null, reminder: null, is_deleted: false, created_at: today.toISOString(), updated_at: today.toISOString(),
  });
  const rows = [
    schedule('s1', '오늘 회의', today, 'high'),
    schedule('s2', '오늘 점심', today, 'normal'),
    schedule('s3', '다른 날 일정', new Date(today.getFullYear(), today.getMonth(), today.getDate() === 1 ? 2 : 1), 'low'),
  ];

  await page.addInitScript(() => sessionStorage.setItem('memory_splash_shown', '1'));
  await page.route('**/auth/v1/**', (route) => route.fulfill({ json: route.request().url().includes('/token') ? { access_token: token, refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600, user } : user }));
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const table = new URL(request.url()).pathname.split('/').pop();
    const single = request.headers().accept?.includes('vnd.pgrst.object');
    let data: any = [];
    if (table === 'users') data = [{ dark_mode: false, profile_image: '', notification_settings: {} }];
    if (table === 'schedules' && request.method() === 'GET') data = rows;
    await route.fulfill({ json: single ? data[0] : data });
  });
  await page.goto('/');
  await page.getByLabel('이메일', { exact: true }).fill(user.email);
  await page.getByLabel('비밀번호', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '통합 계정으로 시작', exact: true }).click();
  // 오늘 일정이 있으면 앱이 주요 일정 팝업을 띄우므로 먼저 닫는다.
  await page.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('button', { name: '캘린더', exact: true }).filter({ visible: true }).click();
  return today;
}

test('mobile calendar shows a month grid, navigates months and selects a day', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-375', 'mobile calendar only');
  const today = await openMobileCalendar(page);

  await page.getByRole('button', { name: '월간', exact: true }).click();
  await expect(page.getByText('월간 일정', { exact: true })).toBeVisible();

  const grid = page.getByLabel(`${today.getFullYear()}년 ${today.getMonth() + 1}월 달력`);
  await expect(grid).toBeVisible();
  const todayCell = grid.getByRole('button', { name: new RegExp(`^${today.getMonth() + 1}월 ${today.getDate()}일.*일정 2개$`) });
  await expect(todayCell).toHaveAttribute('aria-current', 'date');
  await expect(page.getByText('오늘 회의', { exact: true })).toBeVisible();
  await expect(page.getByText('오늘 점심', { exact: true })).toBeVisible();

  // The grid must fit the 375px viewport without horizontal overflow.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const otherDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() === 1 ? 2 : 1);
  await grid.getByRole('button', { name: new RegExp(`^${otherDay.getMonth() + 1}월 ${otherDay.getDate()}일.*일정 1개$`) }).first().click();
  await expect(page.getByText('다른 날 일정', { exact: true })).toBeVisible();
  await expect(page.getByText('오늘 회의', { exact: true })).toHaveCount(0);

  const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  await page.getByRole('button', { name: '다음 달', exact: true }).click();
  await expect(page.getByLabel(`${next.getFullYear()}년 ${next.getMonth() + 1}월 달력`)).toBeVisible();
  await page.getByRole('button', { name: '이전 달', exact: true }).click();
  await expect(grid).toBeVisible();

  await page.screenshot({ path: process.env.MONTH_SHOT || testInfo.outputPath('mobile-month.png') });
});
