'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { CircleCheck } from 'lucide-react';
import { ShareDialog } from '@/components/share-dialog';
import { ReadContent } from '@/components/read-body';
import { ReadStatus, ReadHeaderActions } from '@/components/read-status';
import type { ReadStatusKind } from '@/components/read-status';
import { DownloadDialog } from '@/components/download-dialog';
import { useReaderChrome } from '@/lib/use-reader-chrome';
import { ReadingTrack } from '@/components/reading-progress';
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
 const [progress,setProgress]=useState(0);
 useEffect(()=>{failOnce.current=new URLSearchParams(window.location.search).get('fail')==='1';setLoad('loading');setProgress(0);const t=setTimeout(()=>setLoad(failOnce.current?'error':'ready'),550);return()=>clearTimeout(t)},[params.id]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3200);return()=>clearTimeout(t)},[toast]);
 const retry=()=>{failOnce.current=false;setLoad('loading');setTimeout(()=>setLoad('ready'),450)};
 const status:ReadStatusKind|null=load!=='ready'?load:!item?'missing':item.stopped?'stopped':null;
 const isDeck=item?.kind==='幻灯片';
 const { hidden:chromeHidden, mainRef }=useReaderChrome(!status&&!share&&!dl,params.id);
 useEffect(()=>{
  if(status||!item||isDeck)return;
  let raf=0;
  const calc=()=>{raf=0;const max=document.documentElement.scrollHeight-window.innerHeight;setProgress(max>0?Math.min(1,Math.max(0,window.scrollY/max)):0)};
  const onScroll=()=>{if(!raf)raf=requestAnimationFrame(calc)};
  calc();
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);if(raf)cancelAnimationFrame(raf)};
 },[status,item,isDeck]);
 return <div className="shell reader-shell">
 <header className="reader-header" data-hidden={chromeHidden} inert={chromeHidden}><div className="reader-header-inner">{!status&&item&&<ReadingTrack progress={progress}/>}<ReadHeaderActions item={item} canRead={!status} loggedIn={auth.loggedIn} onShare={setShare} onDownload={()=>setDl(true)}/></div></header>
 <main className="reader-main" ref={mainRef}>
 {status?<ReadStatus kind={status} onRetry={retry} loggedIn={auth.loggedIn}/>
 :item&&<ReadContent item={item} items={items} missing={upload&&stage==='missing'} onProgress={setProgress}/>}
 </main>
 {share&&<ShareDialog item={share} onClose={()=>setShare(null)} onFallback={setToast}/>}
 {item&&<DownloadDialog item={item} open={dl} onClose={()=>setDl(false)} onToast={setToast}/>}
 {toast&&<div role="status" className="toast"><CircleCheck size={17}/>{toast}</div>}
 </div>
}
