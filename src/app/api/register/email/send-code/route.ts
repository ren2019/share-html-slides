import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { database } from '@/db';
import { emailRegistration } from '@/db/schema';
import { allowEmailSend, emailCodeHash, reserveEmailDelivery, sendEmailCode } from '@/lib/email';
import { config } from '@/lib/config';
import { error } from '@/lib/http';
export async function POST(request: Request) {
  if (!config().emailEnabled) return error('EMAIL_UNAVAILABLE', '邮件服务未配置', 503);
  if (request.headers.get('origin') !== new URL(config().baseURL).origin) return error('FORBIDDEN', '请求来源无效', 403);
  let email: string;
  try { email = z.strictObject({ email: z.email().max(254).refine(value => !value.toLowerCase().endsWith('@phone.invalid')).transform(value => value.toLowerCase()) }).parse(await request.json()).email; }
  catch { return error('INVALID_INPUT', '请输入有效邮箱', 400); }
  if (!await allowEmailSend(request)) return error('RATE_LIMITED', '请稍后再获取验证码', 429);
  if (!await reserveEmailDelivery(email)) return error('RATE_LIMITED', '请稍后再获取验证码', 429);
  const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const values = { email, codeHash: emailCodeHash(email, otp), attempts: 0, expiresAt: new Date(Date.now() + 300_000) };
  await database().insert(emailRegistration).values(values).onConflictDoUpdate({ target: emailRegistration.email, set: values });
  try { await sendEmailCode({ email, otp }); }
  catch { return error('DELIVERY_FAILED', '验证码发送失败，请稍后重试', 503); }
  return Response.json({ success: true });
}
