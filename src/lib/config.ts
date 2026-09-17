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
  return { baseURL, secret, databaseURL: process.env.DATABASE_URL, smsURL, smsToken, smsEnabled: Boolean(smsURL && smsToken) };
}
