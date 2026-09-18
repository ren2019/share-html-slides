import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { fixtureSQL } from './fixtures';
let application: ChildProcess;
async function startApplication() {
  application = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3214'], {
    detached: true, stdio: 'ignore', env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL, APP_URL: 'http://127.0.0.1:3214', BETTER_AUTH_SECRET: 'integration-only-secret-not-for-production', SMS_GATEWAY_URL: 'http://127.0.0.1:3212/send', SMS_GATEWAY_TOKEN: 'integration-only', NEXT_DIST_DIR: '.next-restart', SMTP_HOST: '', SMTP_USER: '', SMTP_PASSWORD: '', SMTP_FROM: '' },
  });
  await expect.poll(async () => { try { return (await fetch('http://127.0.0.1:3214/login')).status; } catch { return 0; } }, { timeout: 30_000 }).toBe(200);
}
async function stopApplication() {
  const stopped = once(application, 'exit');
  process.kill(-application.pid!, 'SIGTERM');
  await stopped;
}
test('应用进程重启后账号、会话与材料归属仍可恢复', async ({ playwright, request }) => {
  const client = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3214', extraHTTPHeaders: { origin: 'http://127.0.0.1:3214', 'x-forwarded-for': '192.0.2.40' } });
  await startApplication();
  try {
    const phoneNumber = '+8619' + Date.now().toString().slice(-9), password = 'persistent-password-123';
    expect((await client.post('/api/auth/phone-number/send-otp', { data: { phoneNumber } })).ok()).toBeTruthy();
    const { code } = await (await request.get('http://127.0.0.1:3212/?phone=' + encodeURIComponent(phoneNumber))).json();
    expect((await client.post('/api/register', { data: { phoneNumber, code, password } })).status()).toBe(201);
    expect((await client.post('/api/auth/sign-in/phone-number', { data: { phoneNumber, password } })).ok()).toBeTruthy();
    const { ownerId } = await (await client.get('/api/materials')).json();
    await fixtureSQL('INSERT INTO materials (id, owner_id, title, original_filename) VALUES ($1, $2, $3, $4)', ['restart-material', ownerId, '重启后保留的材料', 'persistent.html']);
    const identity = await (await client.get('/api/materials')).json();
    expect(identity.items).toEqual([expect.objectContaining({ title: '重启后保留的材料' })]);
    await stopApplication();
    await startApplication();
    expect(await (await client.get('/api/materials')).json()).toEqual(identity);
    expect((await client.post('/api/auth/sign-out', { data: {} })).ok()).toBeTruthy();
    expect((await client.post('/api/auth/sign-in/phone-number', { data: { phoneNumber, password } })).ok()).toBeTruthy();
    expect(await (await client.get('/api/materials')).json()).toEqual(identity);
  } finally { await stopApplication(); await client.dispose(); }
});
