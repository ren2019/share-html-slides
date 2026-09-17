'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
export function SignOut() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <div><Button variant="ghost" disabled={busy} onClick={async () => {
    setBusy(true); setError('');
    try { const response = await fetch('/api/auth/sign-out', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); if (!response.ok) throw new Error(); router.replace('/login'); router.refresh(); }
    catch { setError('退出失败，请重试'); } finally { setBusy(false); }
  }}>退出登录</Button>{error && <span role="alert">{error}</span>}</div>;
}
