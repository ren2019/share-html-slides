import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { hashPassword } from 'better-auth/crypto';
import { APIError } from 'better-auth/api';
import { database } from '@/db';
import { user, account } from '@/db/schema';
import { getAuth } from '@/lib/auth';
import { config } from '@/lib/config';
import { error } from '@/lib/http';
const registration = z.strictObject({ phoneNumber: z.string().regex(/^\+[1-9]\d{7,14}$/), code: z.string().regex(/^\d{6}$/), password: z.string().min(10).max(128) });
export async function POST(request: Request) {
  if (!config().smsEnabled) return error('SMS_UNAVAILABLE', '短信服务未配置，暂不能注册', 503);
  if (request.headers.get('origin') !== new URL(config().baseURL).origin) return error('FORBIDDEN', '请求来源无效', 403);
  let body;
  try { body = registration.parse(await request.json()); } catch { return error('INVALID_INPUT', '请检查手机号、验证码和密码（10–128位）', 400); }
  try {
    await getAuth().api.consumePhoneNumberOTP({ body: { phoneNumber: body.phoneNumber, code: body.code } });
    const password = await hashPassword(body.password);
    const id = randomUUID();
    await database().transaction(async tx => {
      await tx.insert(user).values({ id, name: `发布者 ${body.phoneNumber.slice(-4)}`, email: `${id}@phone.invalid`, phoneNumber: body.phoneNumber, phoneNumberVerified: true });
      await tx.insert(account).values({ id: randomUUID(), accountId: id, providerId: 'credential', userId: id, password });
    });
    return Response.json({ success: true }, { status: 201 });
  } catch (cause) {
    if (cause instanceof APIError) return error('VERIFICATION_FAILED', '验证码无效或已过期，请重新获取', 400);
    if (cause && typeof cause === 'object' && 'cause' in cause && (cause.cause as { code?: string })?.code === '23505') return error('ACCOUNT_EXISTS', '该手机号已注册，请登录或找回密码', 409);
    return error('REGISTRATION_FAILED', '注册未完成，请稍后重试', 503);
  }
}
