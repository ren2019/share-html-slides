'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CircleCheck } from 'lucide-react';
import { OrigamiMark } from '@/components/origami-mark';
import { ShareDialog } from '@/components/share-dialog';
import { ReadContent } from '@/components/read-body';
import { ReadStatus, ReadHeaderActions } from '@/components/read-status';
import type { ReadStatusKind } from '@/components/read-status';
import { DownloadDialog } from '@/components/download-dialog';
import { useLibrary, useThemeSync } from '@/lib/library';
import type { Material } from '@/lib/library';

export default function ReadPage(){
 useThemeSync();
 const {items,upload,stage,auth}=useLibrary();
 const params=useParams<{id:string}>();
 const item=items.find(i=>i.id===Number(params.id));
 const failOnce=useRef(false);
 const [load,setLoad]=useState<'loading'|'error'|'ready'>('loading');
 const [share,setShare]=useState<Material|null>(null),[toast,setToast]=useState(''),[dl,setDl]=useState(false);
 useEffect(()=>{failOnce.current=new URLSearchParams(window.location.search).get('fail')==='1';setLoad('loading');const t=setTimeout(()=>setLoad(failOnce.current?'error':'ready'),550);return()=>clearTimeout(t)},[params.id]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3200);return()=>clearTimeout(t)},[toast]);
 const retry=()=>{failOnce.current=false;setLoad('loading');setTimeout(()=>setLoad('ready'),450)};
 const status:ReadStatusKind|null=load!=='ready'?load:!item?'missing':item.stopped?'stopped':null;
 return <div className="shell reader-shell">
 <header className="reader-header"><div className="reader-header-inner"><Link href="/" className="reader-brand" aria-label="纸飞机首页"><OrigamiMark/><span>纸飞机</span></Link><ReadHeaderActions item={item} canRead={!status} loggedIn={auth.loggedIn} onShare={setShare} onDownload={()=>setDl(true)}/></div></header>
 <main className="reader-main">
 {status?<ReadStatus kind={status} onRetry={retry} loggedIn={auth.loggedIn}/>
 :item&&<ReadContent item={item} items={items} missing={upload&&stage==='missing'} loggedIn={auth.loggedIn}/>}
 </main>
 {share&&<ShareDialog item={share} onClose={()=>setShare(null)} onFallback={setToast}/>}
 {item&&<DownloadDialog item={item} open={dl} onClose={()=>setDl(false)} onToast={setToast}/>}
 {toast&&<div role="status" className="toast"><CircleCheck size={17}/>{toast}</div>}
 </div>
}
