'use client';
import { useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { Material } from '@/lib/library';

export function ShareDialog({item,onClose,onFallback}:{item:Material;onClose:()=>void;onFallback:(m:string)=>void}){
 const [text,setText]=useState(`给你分享《${item.title}》\nhttps://paperplane.example/read/${item.id}`),[copied,setCopied]=useState(false),[failed,setFailed]=useState(false);
 const copy=async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);setFailed(false)}catch{setFailed(true);onFallback('自动复制失败，请手动复制文案')}};
 return <Dialog open onOpenChange={v=>{if(!v)onClose()}}><DialogContent className="share-dialog"><DialogHeader><DialogTitle>分享这份材料</DialogTitle><DialogDescription>复制文字和链接，粘贴到微信或其他聊天中。</DialogDescription></DialogHeader><div className="share-material"><FileCode2 size={24}/><strong>{item.title}</strong></div><label className="field-label" htmlFor="share-text">分享文案 <span>可以修改</span></label><Textarea id="share-text" value={text} onChange={e=>{setText(e.target.value);setCopied(false);setFailed(false)}}/><p className="fixture-label">在微信中打开阅读页时：点窗口右上角「···」即可转发给朋友或分享到群聊，也可以复制上方文案粘贴发送。</p>{failed?<p className="fixture-label">自动复制失败：请长按或全选上方文案，手动复制完整文字。</p>:<p className="fixture-label">演示链接使用 .example，不能实际对外阅读。</p>}<Button className="brand-button" onClick={copy}>{copied?<Check/>:<Copy/>}{copied?'已复制':'复制文案与链接'}</Button></DialogContent></Dialog>
}
