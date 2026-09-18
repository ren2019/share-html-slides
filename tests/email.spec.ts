import { test, expect } from '@playwright/test';
test('邮箱验证码和密码注册不要求手机号', async ({ request }) => {
  const email = `publisher-${Date.now()}@example.test`;
  const headers = { origin: 'http://127.0.0.1:3210' };
  expect((await request.post('/api/register/email/send-code', { headers, data: { email } })).status()).toBe(200);
});
test('网页邮箱验证后设置密码进入材料库', async ({ page, request }) => {
  const email = `browser-${Date.now()}@example.test`;
  await page.goto('/login');
  await page.getByRole('button', { name: '邮箱', exact: true }).click();
  await page.getByRole('button', { name: '注册账号', exact: true }).click();
  await page.getByLabel('邮箱', { exact: true }).fill(email);
  await page.getByRole('button', { name: '获取验证码', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('验证码 5 分钟');
  const { code } = await (await request.get('http://127.0.0.1:3213/?email=' + encodeURIComponent(email))).json();
  expect(code).toMatch(/^\d{6}$/);
  await page.getByLabel('验证码', { exact: true }).fill(code);
  await page.getByLabel('密码', { exact: true }).fill('email-password-123');
  await page.getByRole('button', { name: '验证并注册', exact: true }).click();
  await expect(page.getByRole('heading', { name: '我的材料库' })).toBeVisible();
});

test('邮箱注册拒绝错误或过期码，三次错误锁定且并发只创建一次', async ({ request }) => {
  const { fixtureSQL } = await import('./fixtures');
  const headers = { origin: 'http://127.0.0.1:3210', 'x-forwarded-for': '192.0.2.101' };
  const email = `attempts-${Date.now()}@example.test`, password = 'email-password-123';
  const send = () => request.post('/api/register/email/send-code', { headers, data: { email } });
  expect((await send()).ok()).toBeTruthy();
  const { code } = await (await request.get('http://127.0.0.1:3213/?email=' + email)).json();
  expect((await send()).status()).toBe(429);
  const data = { email, code, password };
  expect((await request.post('/api/register/email', { headers: { origin: 'https://other.example' }, data })).status()).toBe(403);
  expect((await request.post('/api/register/email', { headers, data: { ...data, password: 'short' } })).status()).toBe(400);
  const wrong = code === '000000' ? '111111' : '000000';
  const wrongResults = await Promise.all(Array.from({ length: 3 }, () => request.post('/api/register/email', { headers, data: { ...data, code: wrong } })));
  expect(wrongResults.map(response => response.status())).toEqual([400, 400, 400]);
  expect((await request.post('/api/register/email', { headers, data })).status()).toBe(400);
  expect((await request.get('/api/materials')).status()).toBe(401);
  await fixtureSQL('UPDATE email_cooldowns SET sent_at = NOW() - INTERVAL \'61 seconds\' WHERE email = $1', [email]);
  expect((await send()).ok()).toBeTruthy();
  const fresh = await (await request.get('http://127.0.0.1:3213/?email=' + email)).json();
  await fixtureSQL('UPDATE email_registrations SET expires_at = NOW() - INTERVAL \'1 second\' WHERE email = $1', [email]);
  expect((await request.post('/api/register/email', { headers, data: { ...data, code: fresh.code } })).status()).toBe(400);
  await fixtureSQL('UPDATE email_cooldowns SET sent_at = NOW() - INTERVAL \'61 seconds\' WHERE email = $1', [email]);
  expect((await send()).ok()).toBeTruthy();
  const final = await (await request.get('http://127.0.0.1:3213/?email=' + email)).json();
  const results = await Promise.all([1, 2].map(() => request.post('/api/register/email', { headers, data: { ...data, code: final.code } })));
  expect(results.map(response => response.status()).sort()).toEqual([201, 400]);
  expect((await request.post('/api/register/email', { headers, data: { ...data, code: final.code } })).status()).toBe(400);
});

test('邮箱大小写归一化，重置密码撤销旧会话且发码停用仍可登录', async ({ playwright, request }) => {
  const { fixtureSQL } = await import('./fixtures');
  const email = `reset-${Date.now()}@example.test`, password = 'old-email-password';
  const client = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3210', extraHTTPHeaders: { origin: 'http://127.0.0.1:3210', 'x-forwarded-for': '192.0.2.102' } });
  expect((await client.post('/api/register/email/send-code', { data: { email: email.toUpperCase() } })).ok()).toBeTruthy();
  let delivery = await (await request.get('http://127.0.0.1:3213/?email=' + email)).json();
  expect((await client.post('/api/register/email', { data: { email, code: delivery.code, password } })).status()).toBe(201);
  expect((await client.post('/api/auth/sign-in/email', { data: { email: email.toUpperCase(), password } })).ok()).toBeTruthy();
  const { ownerId } = await (await client.get('/api/materials')).json();
  expect(ownerId).toBeTruthy();
  await fixtureSQL('UPDATE email_cooldowns SET sent_at = NOW() - INTERVAL \'61 seconds\' WHERE email = $1', [email]);
  expect((await client.post('/api/auth/email-otp/request-password-reset', { data: { email: email.toUpperCase() } })).ok()).toBeTruthy();
  delivery = await (await request.get('http://127.0.0.1:3213/?email=' + email)).json();
  expect((await client.post('/api/auth/email-otp/reset-password', { data: { email: email.toUpperCase(), otp: delivery.code, password: 'new-email-password' } })).ok()).toBeTruthy();
  expect((await client.get('/api/materials')).status()).toBe(401);
  expect((await client.post('/api/auth/sign-in/email', { data: { email, password } })).status()).toBe(401);
  expect((await client.post('/api/auth/email-otp/reset-password', { data: { email, otp: delivery.code, password: 'another-password' } })).status()).toBe(400);
  const disabled = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3211', extraHTTPHeaders: { origin: 'http://127.0.0.1:3211', 'x-forwarded-for': '192.0.2.103' } });
  expect((await disabled.post('/api/register/email/send-code', { data: { email } })).status()).toBe(503);
  expect((await disabled.post('/api/auth/email-otp/request-password-reset', { data: { email } })).status()).toBe(503);
  expect((await disabled.post('/api/auth/sign-in/email', { data: { email, password: 'new-email-password' } })).ok()).toBeTruthy();
  expect((await (await disabled.get('/api/materials')).json()).ownerId).toBe(ownerId);
  await Promise.all([client.dispose(), disabled.dispose()]);
});

test('邮箱身份入口拒绝占位地址与验证码直接登录；未验证邮箱不能取得材料库会话', async ({ request }) => {
  const { fixtureSQL } = await import('./fixtures');
  const { hashPassword } = await import('better-auth/crypto');
  const email = `unverified-${Date.now()}@example.test`, id = `unverified-${Date.now()}`, password = 'unverified-password';
  await fixtureSQL('INSERT INTO users (id, name, email, email_verified) VALUES ($1, $2, $3, false)', [id, '未验证', email]);
  await fixtureSQL('INSERT INTO accounts (id, account_id, provider_id, user_id, password) VALUES ($1, $1, $2, $1, $3)', [id, 'credential', await hashPassword(password)]);
  const headers = { origin: 'http://127.0.0.1:3210', 'x-forwarded-for': '192.0.2.104' };
  expect((await request.post('/api/auth/sign-in/email', { headers, data: { email, password } })).status()).toBe(403);
  expect((await request.get('/api/materials')).status()).toBe(401);
  for (const path of ['/api/register/email/send-code', '/api/register/email', '/api/auth/sign-in/email', '/api/auth/email-otp/request-password-reset', '/api/auth/email-otp/reset-password']) {
    expect((await request.post(path, { headers, data: { email: 'arbitrary@phone.invalid', password, code: '123456', otp: '123456' } })).status()).toBe(400);
  }
  for (const path of ['/api/auth/sign-in/email-otp', '/api/auth/email-otp/verify-email', '/api/auth/email-otp/send-verification-otp', '/api/auth/sign-up/email']) expect((await request.post(path, { headers, data: { email } })).status()).toBe(404);
});

test('同一来源切换邮箱不能绕过发送限流', async ({ request }) => {
  const headers = { origin: 'http://127.0.0.1:3210', 'x-forwarded-for': '192.0.2.105' };
  for (let index = 0; index < 5; index++) expect((await request.post('/api/register/email/send-code', { headers, data: { email: `limit-${Date.now()}-${index}@example.test` } })).status()).toBe(200);
  expect((await request.post('/api/register/email/send-code', { headers, data: { email: `limit-${Date.now()}-denied@example.test` } })).status()).toBe(429);
});

test('只配置邮箱时默认邮箱注册，短信不可用不阻塞邮箱身份', async ({ page, request }) => {
  const email = `email-only-${Date.now()}@example.test`;
  await page.goto('http://127.0.0.1:3215/login');
  await page.getByRole('button', { name: '注册账号', exact: true }).click();
  await expect(page.getByRole('button', { name: '手机号', exact: true })).toBeDisabled();
  await page.getByLabel('邮箱', { exact: true }).fill(email);
  await page.getByRole('button', { name: '获取验证码', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('验证码 5 分钟');
  const { code } = await (await request.get('http://127.0.0.1:3213/?email=' + email)).json();
  await page.getByLabel('验证码', { exact: true }).fill(code);
  await page.getByLabel('密码', { exact: true }).fill('email-only-password');
  await page.getByRole('button', { name: '验证并注册', exact: true }).click();
  await expect(page.getByRole('heading', { name: '我的材料库' })).toBeVisible();
  expect((await request.post('http://127.0.0.1:3215/api/auth/phone-number/send-otp', { data: { phoneNumber: '+8613800000001' } })).status()).toBe(503);
});
