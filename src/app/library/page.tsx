import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { Files } from 'lucide-react';
import { database } from '@/db';
import { material } from '@/db/schema';
import { publisher } from '@/lib/auth';
import { Header } from '@/components/header';
import { SignOut } from '@/components/sign-out';
export const dynamic = 'force-dynamic';
export default async function LibraryPage() {
  const user = await publisher(await headers());
  if (!user) redirect('/login');
  const items = await database().select().from(material).where(eq(material.ownerId, user.id)).orderBy(desc(material.createdAt)).limit(100);
  return <><Header><SignOut/></Header><main className="workspace"><div className="library-head"><div><h1>我的材料库</h1><span className="muted">{user.name}</span></div><span className="muted">{items.length} 份材料</span></div>
    {items.length ? <ul className="material-list">{items.map(item => <li key={item.id}><strong>{item.title}</strong><p className="muted">{item.originalFilename}</p></li>)}</ul> : <div className="empty"><Files size={36} strokeWidth={1.4}/><p>还没有材料</p><p className="muted">你发布的 HTML 内容将在这里显示。</p></div>}
  </main></>;
}
