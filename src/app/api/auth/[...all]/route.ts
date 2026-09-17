import { sql } from 'drizzle-orm';
import { database } from '@/db';
import { getAuth } from '@/lib/auth';
import { config } from '@/lib/config';
import { error } from '@/lib/http';
const paths = new Set(['/get-session', '/sign-in/phone-number', '/sign-out', '/phone-number/send-otp', '/phone-number/request-password-reset', '/phone-number/reset-password']);
async function handle(request: Request) {
  const path = new URL(request.url).pathname.slice('/api/auth'.length);
  if (!paths.has(path)) return error('NOT_FOUND', '入口不可用', 404);
  if (path.startsWith('/phone-number/') && !config().smsEnabled) return error('SMS_UNAVAILABLE', '短信服务未配置', 503);
  if (request.method === 'POST' && (path === '/phone-number/send-otp' || path === '/phone-number/request-password-reset')) {
    if (request.headers.get('origin') !== new URL(config().baseURL).origin) return error('FORBIDDEN', '请求来源无效', 403);
    let phoneNumber: unknown;
    try { phoneNumber = (await request.clone().json()).phoneNumber; } catch { return error('INVALID_INPUT', '请输入有效手机号', 400); }
    if (typeof phoneNumber !== 'string' || !/^\+[1-9]\d{7,14}$/.test(phoneNumber)) return error('INVALID_INPUT', '请输入有效手机号', 400);
    // Reserve before Better Auth creates an OTP so rejected resends preserve the sent code.
    const acquired = await database().execute(sql`
      INSERT INTO sms_cooldowns (phone_number, sent_at) VALUES (${phoneNumber}, NOW())
      ON CONFLICT (phone_number) DO UPDATE SET sent_at = NOW()
      WHERE sms_cooldowns.sent_at < NOW() - INTERVAL '60 seconds' RETURNING phone_number`);
    if (!acquired.rows.length) return error('RATE_LIMITED', '请稍后再获取验证码', 429);
  }
  return getAuth().handler(request);
}
export const GET = handle;
export const POST = handle;
