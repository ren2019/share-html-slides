import { eq, desc } from 'drizzle-orm';
import { database } from '@/db';
import { material } from '@/db/schema';
import { publisher } from '@/lib/auth';
import { error } from '@/lib/http';
export async function GET(request: Request) {
  const user = await publisher(request.headers);
  if (!user) return error('UNAUTHENTICATED', '请先登录', 401);
  if (new URL(request.url).searchParams.has('ownerId')) return error('INVALID_QUERY', '材料库仅允许查询本人', 400);
  const items = await database().select().from(material).where(eq(material.ownerId, user.id)).orderBy(desc(material.createdAt)).limit(100);
  return Response.json({ ownerId: user.id, items }, { headers: { 'Cache-Control': 'no-store' } });
}
