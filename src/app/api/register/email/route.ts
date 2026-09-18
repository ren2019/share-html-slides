import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { database } from '@/db';
import { user, account, emailRegistration } from '@/db/schema';
import { emailCodeHash } from '@/lib/email';
import { config } from '@/lib/config';
import { error } from '@/lib/http';
const registration = z.strictObject({ email: z.email().max(254).refine(value => !value.toLowerCase().endsWith('@phone.invalid')).transform(value => value.toLowerCase()), code: z.string().regex(/^\d{6}$/), password: z.string().min(10).max(128) });
export async function POST(request: Request) {
  if (!config().emailEnabled) return error('EMAIL_UNAVAILABLE', '邮件服务未配置，暂不能注册', 503);
  if (request.headers.get('origin') !== new URL(config().baseURL).origin) return error('FORBIDDEN', '请求来源无效', 403);
  let body;
  try { body = registration.parse(await request.json()); } catch { return error('INVALID_INPUT', '请检查邮箱、验证码和密码（10–128位）', 400); }
  try {
    const result = await database().transaction(async tx => {
      const [challenge] = await tx.select().from(emailRegistration).where(eq(emailRegistration.email, body.email)).for('update');
      if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= 3) return 'invalid';
      if (challenge.codeHash !== emailCodeHash(body.email, body.code)) {
        await tx.update(emailRegistration).set({ attempts: sql`${emailRegistration.attempts} + 1` }).where(eq(emailRegistration.email, body.email));
        return 'invalid';
      }
      await tx.delete(emailRegistration).where(eq(emailRegistration.email, body.email));
      if ((await tx.select({ id: user.id }).from(user).where(eq(user.email, body.email))).length) return 'exists';
      const id = randomUUID(), password = await hashPassword(body.password);
      await tx.insert(user).values({ id, name: '发布者', email: body.email, emailVerified: true });
      await tx.insert(account).values({ id: randomUUID(), accountId: id, providerId: 'credential', userId: id, password });
      return 'created';
    });
    if (result === 'invalid') return error('VERIFICATION_FAILED', '验证码无效或已过期，请重新获取', 400);
    if (result === 'exists') return error('ACCOUNT_EXISTS', '该邮箱已注册，请登录或找回密码', 409);
    return Response.json({ success: true }, { status: 201 });
  } catch { return error('REGISTRATION_FAILED', '注册未完成，请稍后重试', 503); }
}
