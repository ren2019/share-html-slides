'use client';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CircleAlert, Download, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Material } from '@/lib/library';

export type ReadStatusKind='loading'|'error'|'missing'|'stopped';

export function ReadStatus({kind,onRetry,loggedIn}:{kind:ReadStatusKind;onRetry:()=>void;loggedIn:boolean}){
 const back=loggedIn&&<Link href="/" className="back-link"><ArrowLeft size={14}/>返回材料库</Link>;
 if(kind==='loading')return <div className="empty"><Loader2 size={30} className="spin"/><h2>正在加载材料…</h2><p>演示加载状态。</p></div>;
 if(kind==='error')return <div className="empty"><CircleAlert size={34} strokeWidth={1.2}/><h2>内容加载失败</h2><p>演示加载失败状态（由 ?fail=1 触发）。可重试，不影响其他材料。</p><Button variant="outline" onClick={onRetry}>重试</Button></div>;
 if(kind==='missing')return <div className="empty"><BookOpen size={36} strokeWidth={1}/><h2>这份材料不存在或已删除</h2><p>原链接不可恢复，其他材料不受影响。</p>{back}</div>;
 return <div className="empty"><CircleAlert size={34} strokeWidth={1.2}/><h2>材料已停止分享</h2><p>恢复分享后，原链接即可继续阅读。</p>{back}</div>;
}

export function ReadHeaderActions({item,canRead,loggedIn,onShare,onDownload}:{item:Material|undefined;canRead:boolean;loggedIn:boolean;onShare:(m:Material)=>void;onDownload:()=>void}){
 return <div className="reader-header-actions">
 {loggedIn&&<Link href="/" className="back-link reader-back" aria-label="返回材料库"><ArrowLeft size={15}/><span>返回材料库</span></Link>}
 {item&&canRead&&<>{item.download&&<Button variant="outline" size="sm" onClick={onDownload}><Download size={14}/>下载</Button>}<Button size="sm" className="brand-button" onClick={()=>onShare(item)}><Link2 size={14}/>分享</Button></>}
 </div>;
}
