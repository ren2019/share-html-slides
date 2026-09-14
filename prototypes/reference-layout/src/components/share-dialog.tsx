'use client';
import { useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { Material } from '@/lib/library';

export function ShareDialog({item,onClose,onFallback}:{item:Material;onClose:()=>void;onFallback:(m:string)=>void}){
 const [text,setText]=useState(`给你分享《${item.title}》\nhttps://paperplane.example/read/${item.id}`),[copied,setCopied]=useState(false);
 return <Dialog open onOpenChange={v=>{if(!v)onClose()}}><DialogContent className="share-dialog"><DialogHeader><DialogTitle>分享这份材料</DialogTitle><DialogDescription>复制文字和链接，粘贴到微信或其他聊天中。</DialogDescription></DialogHeader><div className="share-material"><FileCode2 size={24}/><strong>{item.title}</strong></div><label className="field-label" htmlFor="share-text">分享文案 <span>可以修改</span></label><Textarea id="share-text" value={text} onChange={e=>{setText(e.target.value);setCopied(false)}}/><p className="fixture-label">演示链接使用 .example，不能实际对外阅读。</p><Button className="brand-button" onClick={async()=>{try{await navigator.clipboard.writeText(text);setCopied(true)}catch{onFallback('请长按或选中文字，手动复制')}}}>{copied?<Check/>:<Copy/>}{copied?'已复制':'复制文案与链接'}</Button></DialogContent></Dialog>
}
