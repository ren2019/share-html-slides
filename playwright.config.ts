import { defineConfig } from '@playwright/test';
const databaseURL = process.env.TEST_DATABASE_URL;
if (!databaseURL || !new URL(databaseURL).pathname.endsWith('_test')) throw new Error('TEST_DATABASE_URL must target a dedicated _test database');
const email = { SMTP_HOST: '127.0.0.1', SMTP_PORT: '3224', SMTP_USER: 'test', SMTP_PASSWORD: 'test-only', SMTP_FROM: 'Paperplane <noreply@example.test>' };
const shared = { DATABASE_URL: databaseURL, BETTER_AUTH_SECRET: 'integration-only-secret-not-for-production', NEXT_TELEMETRY_DISABLED: '1' };
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', workers: 1, timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:3210', browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || 'chromium' },
  webServer: [
    { command: 'pnpm exec tsx tests/email-gateway.ts', url: 'http://127.0.0.1:3213', reuseExistingServer: false },
    { command: 'pnpm exec tsx tests/sms-gateway.ts', url: 'http://127.0.0.1:3212', reuseExistingServer: false },
    { command: 'pnpm db:migrate && pnpm exec tsx tests/reset-database.ts && pnpm dev --hostname 127.0.0.1 --port 3210', url: 'http://127.0.0.1:3210', env: { ...shared, ...email, APP_URL: 'http://127.0.0.1:3210', SMS_GATEWAY_URL: 'http://127.0.0.1:3212/send', SMS_GATEWAY_TOKEN: 'integration-only' }, reuseExistingServer: false },
    { command: 'pnpm dev --hostname 127.0.0.1 --port 3211', url: 'http://127.0.0.1:3211', env: { ...shared, APP_URL: 'http://127.0.0.1:3211', NEXT_DIST_DIR: '.next-disabled', SMS_GATEWAY_URL: '', SMS_GATEWAY_TOKEN: '', SMTP_HOST: '', SMTP_USER: '', SMTP_PASSWORD: '', SMTP_FROM: '' }, reuseExistingServer: false },
    { command: 'pnpm dev --hostname 127.0.0.1 --port 3215', url: 'http://127.0.0.1:3215', env: { ...shared, ...email, APP_URL: 'http://127.0.0.1:3215', NEXT_DIST_DIR: '.next-email-only', SMS_GATEWAY_URL: '', SMS_GATEWAY_TOKEN: '' }, reuseExistingServer: false },
  ],
});
