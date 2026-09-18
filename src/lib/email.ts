import nodemailer from 'nodemailer';
import { createHmac, randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { APIError } from 'better-auth/api';
import { database } from '@/db';
import { config } from './config';
export function emailCodeHash(email: string, code: string) {
  return createHmac('sha256', config().secret).update(`${email}:${code}`).digest('hex');
}
export async function allowEmailSend(request: Request) {
  // The trusted reverse proxy must overwrite forwarding headers (see identity.md).
  const address = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const key = `email-send:${address}`, now = Date.now();
  const result = await database().execute(sql`
    INSERT INTO rate_limits (id, key, count, last_request) VALUES (${randomUUID()}, ${key}, 1, ${now})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.last_request < ${now - 60_000} THEN 1 ELSE rate_limits.count + 1 END,
      last_request = CASE WHEN rate_limits.last_request < ${now - 60_000} THEN ${now} ELSE rate_limits.last_request END
    RETURNING count`);
  return Number(result.rows[0].count) <= 5;
}
export async function reserveEmailDelivery(email: string) {
  const acquired = await database().execute(sql`
    INSERT INTO email_cooldowns (email, sent_at) VALUES (${email}, NOW())
    ON CONFLICT (email) DO UPDATE SET sent_at = NOW()
    WHERE email_cooldowns.sent_at < NOW() - INTERVAL '60 seconds' RETURNING email`);
  return acquired.rows.length > 0;
}
export async function sendEmailCode({ email, otp }: { email: string; otp: string }) {
  const { smtp, emailEnabled } = config();
  if (!emailEnabled) throw new APIError('SERVICE_UNAVAILABLE', { message: '邮件服务未配置' });
  const transport = nodemailer.createTransport({
    host: smtp.host, port: smtp.port, secure: smtp.secure,
    requireTLS: process.env.NODE_ENV === 'production' && !smtp.secure,
    auth: { user: smtp.user!, pass: smtp.password! },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 10_000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  try {
    const result = await transport.sendMail({ from: smtp.from, to: email, subject: '纸飞机验证码', text: `你的纸飞机验证码是 ${otp}，5 分钟内有效。若非本人操作，请忽略。` });
    if (!result.accepted.length) throw new Error('Delivery rejected');
  } catch { throw new APIError('SERVICE_UNAVAILABLE', { message: '验证码发送失败，请稍后重试' }); }
  finally { transport.close(); }
}
