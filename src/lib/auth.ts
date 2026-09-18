import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { phoneNumber, emailOTP } from 'better-auth/plugins';
import { APIError } from 'better-auth/api';
import { database } from '@/db';
import * as schema from '@/db/schema';
import { config } from './config';
import { sendEmailCode } from './email';

async function sendSMS({ phoneNumber, code }: { phoneNumber: string; code: string }) {
  const settings = config();
  if (!settings.smsEnabled) throw new APIError('SERVICE_UNAVAILABLE', { message: '短信服务未配置' });
  try {
    const response = await fetch(settings.smsURL!, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.smsToken}` },
      body: JSON.stringify({ phoneNumber, code, expiresIn: 300 }), signal: AbortSignal.timeout(10_000), redirect: 'error',
    });
    if (!response.ok) throw new Error('SMS delivery failed');
  } catch {
    throw new APIError('SERVICE_UNAVAILABLE', { message: '验证码发送失败，请稍后重试' });
  }
}
let auth: ReturnType<typeof createAuth> | undefined;
function createAuth() {
  const settings = config();
  return betterAuth({
    appName: '纸飞机', baseURL: settings.baseURL, secret: settings.secret,
    database: drizzleAdapter(database(), { provider: 'pg', schema, transaction: true }),
    emailAndPassword: { enabled: true, disableSignUp: true, requireEmailVerification: true, minPasswordLength: 10, maxPasswordLength: 128, revokeSessionsOnPasswordReset: true },
    session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 30, customRules: { '/sign-in/phone-number': { window: 60, max: 5 }, '/sign-in/email': { window: 60, max: 5 }, '/email-otp/*': { window: 60, max: 5 }, '/phone-number/*': { window: 60, max: 5 } } },
    advanced: { useSecureCookies: new URL(settings.baseURL).protocol === 'https:', crossSubDomainCookies: { enabled: false } },
    logger: { disabled: true },
    plugins: [emailOTP({ sendVerificationOTP: sendEmailCode, disableSignUp: true, expiresIn: 300, allowedAttempts: 3, storeOTP: 'hashed' }), phoneNumber({ sendOTP: sendSMS, sendPasswordResetOTP: sendSMS, requireVerification: true, expiresIn: 300, allowedAttempts: 3, phoneNumberValidator: value => /^\+[1-9]\d{7,14}$/.test(value) })],
  });
}
export function getAuth() { return auth ??= createAuth(); }
export async function publisher(headers: Headers) {
  const identity = await getAuth().api.getSession({ headers });
  return (identity?.user.phoneNumberVerified || identity?.user.emailVerified) ? identity.user : null;
}
