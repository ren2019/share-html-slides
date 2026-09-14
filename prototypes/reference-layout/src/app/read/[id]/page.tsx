'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CircleAlert, CircleCheck, BookOpen, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrigamiMark } from '@/components/origami-mark';
import { ShareDialog } from '@/components/share-dialog';
import { useLibrary, useThemeSync } from '@/lib/library';
import type { Material } from '@/lib/library';

export default function ReadPage(){
 useThemeSync();
 const {items,upload,stage}=useLibrary();
 const params=useParams<{id:string}>();
 const item=items.find(i=>i.id===Number(params.id));
 const [share,setShare]=useState<Material|null>(null),[toast,setToast]=useState('');
 return <div className="shell">
 <header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="纸飞机材料库"><OrigamiMark/><span>纸飞机<small>PAPERPLANE</small></span></Link><div className="header-actions">{item&&!item.stopped&&<Button variant="outline" size="sm" onClick={()=>setShare(item)}><Link2 size={14}/>分享</Button>}<Link href="/" className="back-link"><ArrowLeft size={15}/>返回材料库</Link></div></div></header>
 <main className="workspace read-workspace">
 {!item?<div className="empty"><BookOpen size={36} strokeWidth={1}/><h2>这份材料不存在或已删除</h2><p>原链接不可恢复，其他材料不受影响。</p><Link href="/" className="back-link"><ArrowLeft size={14}/>返回材料库</Link></div>
 :item.stopped?<div className="empty"><CircleAlert size={34} strokeWidth={1.2}/><h2>材料已停止分享</h2><p>恢复分享后，原链接即可继续阅读。</p><Link href="/" className="back-link"><ArrowLeft size={14}/>返回材料库</Link></div>
 :<><div className="read-meta"><span>NO. {String(item.id).padStart(3,'0')} / {item.kind}</span><span>r{item.revision}</span><span>{item.file}</span><span>首次上传 {item.created}</span><span>最后更新 {item.updated}</span></div>
 <div className="slide-preview"><span>PAPERPLANE / 演示材料</span><h2>{item.title}</h2><div className="slide-line"/><p>项目目标与执行计划</p><small>01 / 08</small></div>
 {upload&&stage==='missing'&&<p className="missing-label read-missing"><CircleAlert size={14}/>关联内容未补齐，预览不完整。</p>}
 <div className="read-actions"><Link href="/" className="back-link"><ArrowLeft size={14}/>返回材料库</Link></div></>}
 </main>
 {share&&<ShareDialog item={share} onClose={()=>setShare(null)} onFallback={setToast}/>}
 {toast&&<div role="status" className="toast"><CircleCheck size={17}/>{toast}</div>}
 </div>
}
