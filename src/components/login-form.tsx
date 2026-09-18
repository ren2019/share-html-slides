'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
type Mode = 'login' | 'register' | 'reset';
async function post(path: string, data: unknown) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || (response.status === 429 ? '操作过于频繁，请稍后重试' : '操作未完成，请检查输入后重试'));
}
export function LoginForm({ smsEnabled, emailEnabled }: { smsEnabled: boolean; emailEnabled: boolean }) {
  const router = useRouter();
  const [channel, setChannel] = useState<'phone' | 'email'>(smsEnabled || !emailEnabled ? 'phone' : 'email');
  const [mode, setMode] = useState<Mode>('login');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  async function sendCode(form: HTMLFormElement) {
    setBusy(true); setMessage('');
    const value = String(new FormData(form).get('identity'));
    const identity = channel === 'email' ? { email: value } : { phoneNumber: value.startsWith('+') ? value : '+86' + value };
    try {
      await post(channel === 'email' ? (mode === 'reset' ? '/api/auth/email-otp/request-password-reset' : '/api/register/email/send-code') : (mode === 'reset' ? '/api/auth/phone-number/request-password-reset' : '/api/auth/phone-number/send-otp'), identity);
      setSent(true); setMessage('若该联系方式可接收此操作的验证码，验证码将于稍后送达。验证码 5 分钟内有效，60 秒后可重发。');
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : '暂时无法发送，请稍后重试'); } finally { setBusy(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const value = String(form.get('identity'));
    const identity = channel === 'email' ? { email: value } : { phoneNumber: value.startsWith('+') ? value : '+86' + value };
    const password = String(form.get('password'));
    try {
      if (mode === 'register') await post(channel === 'email' ? '/api/register/email' : '/api/register', { ...identity, password, code: String(form.get('code')) });
      if (mode === 'reset') {
        await post(channel === 'email' ? '/api/auth/email-otp/reset-password' : '/api/auth/phone-number/reset-password', { ...identity, ...(channel === 'email' ? { password } : { newPassword: password }), otp: String(form.get('code')) });
        setMode('login'); setSent(false); setMessage('密码已重置，请使用新密码登录。');
        return;
      }
      await post(channel === 'email' ? '/api/auth/sign-in/email' : '/api/auth/sign-in/phone-number', { ...identity, password });
      router.replace('/library'); router.refresh();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : '无法连接，请稍后重试'); } finally { setBusy(false); }
  }
  const enabled = channel === 'email' ? emailEnabled : smsEnabled;
  const available = mode === 'login' || enabled;
  return <section className="auth-card">
    <h1>{mode === 'login' ? '发布者登录' : mode === 'register' ? '注册账号' : '找回密码'}</h1>
    <p className="muted">登录后管理自己的材料。通过分享链接阅读与转发，无需登录。</p>
    <div className="auth-tabs">{([['login','登录'],['register','注册账号'],['reset','找回密码']] as const).map(([value,label]) => <button key={value} aria-pressed={mode === value} disabled={busy} onClick={() => { setMode(value); setMessage(''); setSent(false); }}>{label}</button>)}</div>
    <div className="auth-tabs" aria-label="联系方式">{([['phone', '手机号'], ['email', '邮箱']] as const).map(([value, label]) => <button key={value} aria-pressed={channel === value} disabled={busy || (mode !== 'login' && !(value === 'email' ? emailEnabled : smsEnabled))} onClick={() => { setChannel(value); setMessage(''); setSent(false); }}>{label}</button>)}</div>
    {!enabled && <p className="muted">当前暂未开放{channel === 'email' ? '邮箱' : '短信'}注册和密码找回。已有账号仍可使用密码登录。</p>}
    {available && <form key={`${mode}-${channel}`} onSubmit={submit} className="form-col">
      <label>{channel === 'email' ? '邮箱' : '手机号'}<input name="identity" type={channel === 'email' ? 'email' : 'tel'} autoComplete={channel === 'email' ? 'email' : 'tel'} placeholder={channel === 'email' ? '你的邮箱地址' : '手机号（中国大陆可直接填写）'} required maxLength={254} pattern={channel === 'email' ? undefined : '(1[0-9]{10}|\\+[1-9][0-9]{7,14})'} onChange={() => setSent(false)}/></label>
      {mode !== 'login' && <div className="field-row"><label>验证码<input name="code" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6}/></label><Button type="button" variant="outline" disabled={busy} onClick={event => { const form = event.currentTarget.form!; const phoneInput = form.elements.namedItem('identity') as HTMLInputElement; if (phoneInput.reportValidity()) void sendCode(form); }}>获取验证码</Button></div>}
      <label>密码<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={10} maxLength={128} required placeholder={mode === 'login' ? '输入密码' : '设置 10–128 位密码'}/></label>
      <Button type="submit" disabled={busy || (mode !== 'login' && !sent)}>{busy ? '正在处理…' : mode === 'login' ? '登录' : mode === 'register' ? '验证并注册' : '验证并重置密码'}</Button>
    </form>}
    {message && <p role="status" className="form-message">{message}</p>}
  </section>;
}
