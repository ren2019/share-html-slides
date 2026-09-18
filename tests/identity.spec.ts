import { test, expect } from '@playwright/test';
test('匿名用户不能访问个人材料库', async ({ request }) => {
  const response = await request.get('/api/materials');
  expect(response.status()).toBe(401);
  expect(await response.json()).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
});
test('未配置短信时禁止注册且不会暴露验证码登录捷径', async ({ request }) => {
  expect((await request.post('http://127.0.0.1:3211/api/register', { data: { phoneNumber: '+8613800000001', code: '123456', password: 'correct-password' } })).status()).toBe(503);
  expect((await request.post('/api/auth/phone-number/verify', { data: {} })).status()).toBe(404);
  expect((await request.post('/api/auth/sign-up/email', { data: {} })).status()).toBe(404);
});
test('手机验证并设置密码后网页登录个人材料库，退出和重登恢复本人身份', async ({ page, request }) => {
  const phone = '+8613' + Date.now().toString().slice(-9);
  await page.goto('/login');
  await page.getByRole('button', { name: '注册账号', exact: true }).click();
  await page.getByLabel('手机号').fill(phone);
  await page.getByRole('button', { name: '获取验证码', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('验证码 5 分钟');
  const message = await request.get('http://127.0.0.1:3212/?phone=' + encodeURIComponent(phone));
  const { code } = await message.json();
  expect(code).toMatch(/^\d{6}$/);
  await page.getByLabel('验证码', { exact: true }).fill(code);
  await page.getByLabel('密码', { exact: true }).fill('a-test-password-123');
  await page.getByRole('button', { name: '验证并注册', exact: true }).click();
  await expect(page.getByRole('heading', { name: '我的材料库' })).toBeVisible();
  const before = await page.request.get('/api/materials');
  expect(before.ok()).toBeTruthy();
  const { ownerId } = await before.json();
  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get('/api/materials')).status()).toBe(401);
  await page.getByLabel('手机号').fill(phone);
  await page.getByLabel('密码', { exact: true }).fill('a-test-password-123');
  await page.locator('form').getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByRole('heading', { name: '我的材料库' })).toBeVisible();
  expect(await (await page.request.get('/api/materials')).json()).toMatchObject({ ownerId });
});
test('验证码限流不使已发送验证码失效，且验证码只能消费一次', async ({ request }) => {
  const phoneNumber = '+8615' + Date.now().toString().slice(-9);
  const headers = { origin: 'http://127.0.0.1:3210' };
  expect((await request.post('/api/auth/phone-number/send-otp', { headers, data: { phoneNumber } })).ok()).toBeTruthy();
  const { code } = await (await request.get('http://127.0.0.1:3212/?phone=' + encodeURIComponent(phoneNumber))).json();
  expect((await request.post('/api/auth/phone-number/send-otp', { headers, data: { phoneNumber } })).status()).toBe(429);
  const register = () => request.post('/api/register', { headers, data: { phoneNumber, code, password: 'a-test-password-123' } });
  expect((await register()).status()).toBe(201);
  expect((await register()).status()).toBe(400);
});

test('两个账号隔离，错误密码被拒绝，会话过期后拒绝访问，短信停用不影响已有账号', async ({ playwright, request }) => {
  const { fixtureSQL } = await import('./fixtures');
  const headers = { origin: 'http://127.0.0.1:3210', 'x-forwarded-for': '192.0.2.20' };
  const first = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3210', extraHTTPHeaders: headers });
  const second = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3210', extraHTTPHeaders: headers });
  const password = 'account-password-123';
  const phones = ['+8616' + Date.now().toString().slice(-9), '+8617' + Date.now().toString().slice(-9)];
  const ids: string[] = [];
  for (const [index, client] of [first, second].entries()) {
    const phoneNumber = phones[index];
    expect((await client.post('/api/auth/phone-number/send-otp', { data: { phoneNumber } })).ok()).toBeTruthy();
    const { code } = await (await request.get('http://127.0.0.1:3212/?phone=' + encodeURIComponent(phoneNumber))).json();
    expect((await client.post('/api/register', { data: { phoneNumber, code, password } })).status()).toBe(201);
    expect((await client.post('/api/auth/sign-in/phone-number', { data: { phoneNumber, password } })).ok()).toBeTruthy();
    ids.push((await (await client.get('/api/materials')).json()).ownerId);
  }
  expect(ids[0]).not.toBe(ids[1]);
  await fixtureSQL('INSERT INTO materials (id, owner_id, title, original_filename) VALUES ($1, $2, $3, $4)', ['private-material-a', ids[0], '账号甲的材料', 'private-a.html']);
  expect((await (await first.get('/api/materials')).json()).items).toEqual([expect.objectContaining({ title: '账号甲的材料' })]);
  expect((await (await second.get('/api/materials')).json()).items).toEqual([]);
  expect((await second.get('/api/materials?ownerId=' + ids[0])).status()).toBe(400);
  expect((await second.post('/api/auth/sign-in/phone-number', { data: { phoneNumber: phones[0], password: 'incorrect-password' } })).status()).toBe(401);
  expect((await first.post('/api/auth/sign-in/phone-number', { data: { phoneNumber: phones[0], password } })).ok()).toBeTruthy();
  expect((await (await first.get('/api/materials')).json()).ownerId).toBe(ids[0]);
  await fixtureSQL('UPDATE sessions SET expires_at = NOW() - INTERVAL \'1 second\' WHERE user_id = $1', [ids[0]]);
  expect((await first.get('/api/materials')).status()).toBe(401);
  const disabled = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3211', extraHTTPHeaders: { origin: 'http://127.0.0.1:3211', 'x-forwarded-for': '192.0.2.21' } });
  expect((await disabled.post('/api/auth/sign-in/phone-number', { data: { phoneNumber: phones[0], password } })).ok()).toBeTruthy();
  expect((await (await disabled.get('/api/materials')).json()).items).toEqual([expect.objectContaining({ title: '账号甲的材料' })]);
  await Promise.all([first.dispose(), second.dispose(), disabled.dispose()]);
});

test('错误或过期验证码不能注册，弱密码和异源注册不能取得发布者会话', async ({ request }) => {
  const { fixtureSQL } = await import('./fixtures');
  const headers = { origin: 'http://127.0.0.1:3210', 'x-forwarded-for': '192.0.2.30' };
  const phoneNumber = '+8618' + Date.now().toString().slice(-9);
  expect((await request.post('/api/auth/phone-number/send-otp', { headers, data: { phoneNumber } })).ok()).toBeTruthy();
  const { code } = await (await request.get('http://127.0.0.1:3212/?phone=' + encodeURIComponent(phoneNumber))).json();
  const data = { phoneNumber, code, password: 'valid-password-123' };
  expect((await request.post('/api/register', { headers: { origin: 'https://other.example' }, data })).status()).toBe(403);
  expect((await request.post('/api/register', { headers, data: { ...data, password: 'short' } })).status()).toBe(400);
  const wrong = code === '000000' ? '111111' : '000000';
  expect((await request.post('/api/register', { headers, data: { ...data, code: wrong } })).status()).toBe(400);
  await fixtureSQL('UPDATE verifications SET expires_at = NOW() - INTERVAL \'1 second\' WHERE identifier = $1', [phoneNumber]);
  expect((await request.post('/api/register', { headers, data })).status()).toBe(400);
  expect((await request.get('/api/materials')).status()).toBe(401);
});

test('手机号验证找回密码会撤销旧会话，旧密码不能再登录', async ({ playwright, request }) => {
  const { fixtureSQL } = await import('./fixtures');
  const client = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3210', extraHTTPHeaders: { origin: 'http://127.0.0.1:3210', 'x-forwarded-for': '192.0.2.50' } });
  const phoneNumber = '+8614' + Date.now().toString().slice(-9), password = 'old-password-123';
  expect((await client.post('/api/auth/phone-number/send-otp', { data: { phoneNumber } })).ok()).toBeTruthy();
  let delivery = await (await request.get('http://127.0.0.1:3212/?phone=' + encodeURIComponent(phoneNumber))).json();
  expect((await client.post('/api/register', { data: { phoneNumber, code: delivery.code, password } })).status()).toBe(201);
  expect((await client.post('/api/auth/sign-in/phone-number', { data: { phoneNumber, password } })).ok()).toBeTruthy();
  await fixtureSQL('UPDATE sms_cooldowns SET sent_at = NOW() - INTERVAL \'61 seconds\' WHERE phone_number = $1', [phoneNumber]);
  expect((await client.post('/api/auth/phone-number/request-password-reset', { data: { phoneNumber } })).ok()).toBeTruthy();
  delivery = await (await request.get('http://127.0.0.1:3212/?phone=' + encodeURIComponent(phoneNumber))).json();
  expect((await client.post('/api/auth/phone-number/reset-password', { data: { phoneNumber, otp: delivery.code, newPassword: 'new-password-123' } })).ok()).toBeTruthy();
  expect((await client.get('/api/materials')).status()).toBe(401);
  expect((await client.post('/api/auth/sign-in/phone-number', { data: { phoneNumber, password } })).status()).toBe(401);
  expect((await client.post('/api/auth/sign-in/phone-number', { data: { phoneNumber, password: 'new-password-123' } })).ok()).toBeTruthy();
  await client.dispose();
});
