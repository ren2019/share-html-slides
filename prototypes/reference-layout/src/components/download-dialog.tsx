'use client';
import { useEffect, useState } from 'react';
import { Check, CircleAlert, Copy, CornerUpRight, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLibrary } from '@/lib/library';
import type { Material } from '@/lib/library';

type Container={kind:'wechat'|'wecom';simulated:boolean};

export function DownloadDialog({item,open,onClose,onToast}:{item:Material;open:boolean;onClose:()=>void;onToast:(m:string)=>void}){
 const {items}=useLibrary();
 const [copiedLink,setCopiedLink]=useState(false),[dlErr,setDlErr]=useState(''),[guide,setGuide]=useState(false);
 const [container,setContainer]=useState<Container|null>(null);
 useEffect(()=>{
  const q=new URLSearchParams(window.location.search).get('browser');
  if(q==='wechat'||q==='wecom'){setContainer({kind:q,simulated:true});return}
  const ua=navigator.userAgent;
  if(/wxwork/i.test(ua))setContainer({kind:'wecom',simulated:false});
  else if(/MicroMessenger/i.test(ua))setContainer({kind:'wechat',simulated:false});
 },[]);
 const notIncluded=(item.related||[]).map(rel=>({rel,t:items.find(i=>i.file===rel.file)})).filter(({t})=>!t||t.stopped||!t.download);
 const copyDownloadLink=async()=>{const u=`https://paperplane.example/download/${item.id}`;try{await navigator.clipboard.writeText(u);setCopiedLink(true)}catch{setDlErr(u)}};
 const envName=container?.kind==='wecom'?'企业微信':'微信';
 const close=()=>{onClose();setCopiedLink(false);setDlErr('');setGuide(false)};
 const guiding=guide&&!!container;
 return <Dialog open={open} onOpenChange={v=>{if(!v)close()}}><DialogContent className={guiding?'open-browser-guide':'share-dialog'} style={guiding?{position:'fixed',inset:0,top:0,left:0,translate:'0 0',transform:'none',width:'100vw',height:'100dvh',maxWidth:'none',maxHeight:'none'}:undefined}>
 {guiding?<>
 <CornerUpRight size={46} className="obm-arrow" aria-hidden/>
 <div className="obm-body">
 <DialogHeader className="obm-header"><DialogTitle className="obm-title">在浏览器中打开</DialogTitle><DialogDescription className="obm-desc">点击右上角 ···，选择在浏览器中打开</DialogDescription></DialogHeader>
 {container.simulated&&<p className="fixture-label">模拟{envName}环境（?browser={container.kind}，仅原型审查标注）</p>}
 <Button className="brand-button" onClick={()=>setGuide(false)}>我知道了</Button>
 </div>
 </>:<>
 <DialogHeader><DialogTitle>下载文件包</DialogTitle><DialogDescription>演示下载流程，不产生真实文件。</DialogDescription></DialogHeader>
 <div className="dl-list"><div className="dl-row"><FileCode2 size={17}/><span>{item.file}<small>主 HTML · 含已保存的静态资源 · r{item.revision}</small></span><Check size={15}/></div>
 {notIncluded.map(({rel,t})=><div className="dl-row off" key={rel.file}><CircleAlert size={16}/><span>{t?.title||rel.file}<small>未包含：{!t?'未发布或已删除':t.stopped?'已停止分享':'发布者已关闭下载'}</small></span></div>)}
 {notIncluded.length>0&&<p className="fixture-label">以上关联材料为独立材料，不随本包提供。</p>}</div>
 {dlErr&&<div className="dl-fallback"><p className="fixture-label">复制失败，请手动选取以下完整链接：</p><Input readOnly value={dlErr} onFocus={e=>e.target.select()}/></div>}
 <DialogFooter><Button variant="outline" onClick={copyDownloadLink}>{copiedLink?<Check/>:<Copy/>}{copiedLink?'已复制链接':'复制下载链接'}</Button><Button className="brand-button" onClick={()=>{if(container)setGuide(true);else{close();onToast('已开始下载（演示，不产生真实文件）')}}}>下载文件包</Button></DialogFooter>
 </>}
 </DialogContent></Dialog>
}
