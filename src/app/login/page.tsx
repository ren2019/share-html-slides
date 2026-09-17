import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { publisher } from '@/lib/auth';
import { config } from '@/lib/config';
import { Header } from '@/components/header';
import { LoginForm } from '@/components/login-form';
export const dynamic = 'force-dynamic';
export default async function LoginPage() {
  if (await publisher(await headers())) redirect('/library');
  return <><Header/><main className="workspace auth-workspace"><LoginForm smsEnabled={config().smsEnabled}/></main></>;
}
