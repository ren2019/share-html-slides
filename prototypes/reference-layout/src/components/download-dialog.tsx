'use client';
import { useState } from 'react';
import { Check, CircleAlert, Copy, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLibrary } from '@/lib/library';
import type { Material } from '@/lib/library';

export function DownloadDialog({item,open,onClose,onToast}:{item:Material;open:boolean;onClose:()=>void;onToast:(m:string)=>void}){
 const {items}=useLibrary();
 const [copiedLink,setCopiedLink]=useState(false),[dlErr,setDlErr]=useState('');
 const notIncluded=(item.related||[]).map(rel=>({rel,t:items.find(i=>i.file===rel.file)})).filter(({t})=>!t||t.stopped||!t.download);
 const copyDownloadLink=async()=>{const u=`https://paperplane.example/download/${item.id}`;try{await navigator.clipboard.writeText(u);setCopiedLink(true)}catch{setDlErr(u)}};
 return <Dialog open={open} onOpenChange={v=>{if(!v){onClose();setCopiedLink(false);setDlErr('')}}}><DialogContent className="share-dialog"><DialogHeader><DialogTitle>下载文件包</DialogTitle><DialogDescription>演示下载流程，不产生真实文件。</DialogDescription></DialogHeader>
 <div className="dl-list"><div className="dl-row"><FileCode2 size={17}/><span>{item.file}<small>主 HTML · 含已保存的静态资源 · r{item.revision}</small></span><Check size={15}/></div>
 {notIncluded.map(({rel,t})=><div className="dl-row off" key={rel.file}><CircleAlert size={16}/><span>{t?.title||rel.file}<small>未包含：{!t?'未发布或已删除':t.stopped?'已停止分享':'发布者已关闭下载'}</small></span></div>)}
 {notIncluded.length>0&&<p className="fixture-label">以上关联材料为独立材料，不随本包提供。</p>}</div>
 <p className="fixture-label">微信内无法直接保存时：复制下载链接，在系统浏览器中打开。关闭下载入口不等于防止复制已打开的内容。</p>
 {dlErr&&<div className="dl-fallback"><p className="fixture-label">复制失败，请手动选取以下完整链接：</p><Input readOnly value={dlErr} onFocus={e=>e.target.select()}/></div>}
 <DialogFooter><Button variant="outline" onClick={copyDownloadLink}>{copiedLink?<Check/>:<Copy/>}{copiedLink?'已复制链接':'复制下载链接'}</Button><Button className="brand-button" onClick={()=>{onClose();onToast('已开始下载（演示，不产生真实文件）')}}>下载文件包</Button></DialogFooter></DialogContent></Dialog>
}
