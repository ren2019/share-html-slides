function deploymentURL(value: string) {
  try { return new URL(value); } catch { throw new Error('Deployment origin and SMS gateway must be valid URLs'); }
}
export function config() {
  const baseURL = process.env.APP_URL || 'http://localhost:3000';
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const smsURL = process.env.SMS_GATEWAY_URL;
  const smsToken = process.env.SMS_GATEWAY_TOKEN;
  if (process.env.NODE_ENV === 'production') {
    if (deploymentURL(baseURL).protocol !== 'https:') throw new Error('Production APP_URL must use HTTPS');
    if (smsURL && deploymentURL(smsURL).protocol !== 'https:') throw new Error('Production SMS gateway must use HTTPS');
  }
  const smtp = { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', user: process.env.SMTP_USER, password: process.env.SMTP_PASSWORD, from: process.env.SMTP_FROM };
  const emailEnabled = Boolean(smtp.host && smtp.from && smtp.user && smtp.password);
  if (emailEnabled && (!Number.isInteger(smtp.port) || smtp.port < 1 || smtp.port > 65535)) throw new Error('SMTP_PORT must be a valid port');
  return { smtp, emailEnabled, baseURL, secret, databaseURL: process.env.DATABASE_URL, smsURL, smsToken, smsEnabled: Boolean(smsURL && smsToken) };
}
