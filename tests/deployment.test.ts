import { test } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/lib/config';

test('生产环境未启用短信时，残留 URL 不阻断邮箱及已有账号密码入口', () => {
  const original = process.env;
  try {
    process.env = {
      NODE_ENV: 'production', APP_URL: 'https://paperplane.example',
      DATABASE_URL: 'postgresql://localhost/paperplane_test',
      BETTER_AUTH_SECRET: 'deployment-test-only-secret-not-for-real-identity',
      SMTP_HOST: 'smtp.example', SMTP_USER: 'test', SMTP_PASSWORD: 'test-only',
      SMTP_FROM: 'noreply@example.test',
    };
    for (const smsURL of ['http://disabled.example', 'invalid-url']) {
      process.env.SMS_GATEWAY_URL = smsURL;
      assert.equal(config().smsEnabled, false);
      assert.equal(config().emailEnabled, true);
      delete process.env.SMTP_HOST;
      assert.equal(config().emailEnabled, false); // No sender is required for password login.
      process.env.SMTP_HOST = 'smtp.example';
    }
    process.env.SMS_GATEWAY_TOKEN = 'test-only';
    process.env.SMS_GATEWAY_URL = 'http://enabled.example';
    assert.throws(() => config(), /Production SMS gateway must use HTTPS/);
    process.env.SMS_GATEWAY_URL = 'https://enabled.example';
    assert.equal(config().smsEnabled, true);
  } finally { process.env = original; }
});
