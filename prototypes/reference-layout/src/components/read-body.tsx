'use client';
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, CircleAlert, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GithubIcon } from '@/components/github-icon';
import { OrigamiMark } from '@/components/origami-mark';
import { version } from '../../package.json';
import { deckFor, articleFor, embedHtml } from '@/lib/library';
import type { Material, Related } from '@/lib/library';

function RelatedBlock({rel,items}:{rel:Related;items:Material[]}){
 const target=items.find(i=>i.file===rel.file);
 if(rel.as==='link'){
  return target&&!target.stopped
   ?<Link className="rel-link" href={`/read/${target.id}`}><FileCode2 size={17}/><span>{target.title}<small>{rel.file} · r{target.revision}</small></span><ArrowUpRight size={15}/></Link>
   :<div className="rel-dead"><CircleAlert size={15}/>关联内容不可用：{target?'已停止分享':'未发布或已删除'}（{rel.file}）。其余正文不受影响。</div>
 }
 if(!target)return <div className="rel-dead"><CircleAlert size={15}/>嵌入的关联材料不可用：未发布或已删除（{rel.file}）。其余正文不受影响。</div>;
 return <figure className="embed-wrap"><iframe sandbox="" srcDoc={embedHtml(target)} title={rel.file} className="embed-frame"/><figcaption>嵌入关联材料：{rel.file} · r{target.revision}{target.stopped?' · 已停止分享':''} · <Link href={`/read/${target.id}`}>打开完整内容</Link></figcaption></figure>;
}

export function ReadContent({item,items,missing,onProgress}:{item:Material;items:Material[];missing:boolean;onProgress:(n:number)=>void}){
 return <>
 <ReadBody item={item} items={items} onProgress={onProgress}/>
 {missing&&<p className="missing-label read-missing"><CircleAlert size={14}/>关联内容未补齐，预览不完整。</p>}
 <details className="material-info"><summary>材料信息</summary><dl>
 <dt>材料编号</dt><dd>材料 #{item.id}</dd>
 <dt>类型</dt><dd>{item.kind}</dd>
 <dt>文件名</dt><dd>{item.file}</dd>
 <dt>当前版本</dt><dd>r{item.revision}</dd>
 <dt>首次上传</dt><dd>{item.created}</dd>
 <dt>最后更新</dt><dd>{item.updated}</dd>
 </dl></details>
 {!item.download&&<p className="dl-off">发布者已关闭下载。</p>}
 <footer className="reader-footer">
 <div className="rf-top">
 <div className="rf-brand"><Link href="/" className="rf-home"><OrigamiMark/><span>纸飞机</span></Link><span className="rf-ver">原型 v{version}</span></div>
 <a className="github-link" href="https://github.com/ren2019/share-html-slides" target="_blank" rel="noreferrer" aria-label="GitHub 仓库" title="GitHub"><GithubIcon/></a>
 </div>
 <div className="rf-bottom"><span>© 2026 ren2019 · <a href="https://github.com/ren2019/share-html-slides/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT</a></span><span>材料版权归原作者所有</span></div>
 </footer>
 </>;
}

export function ReadBody({item,items,onProgress}:{item:Material;items:Material[];onProgress?:(n:number)=>void}){
 const [idx,setIdx]=useState(0);
 const deck=useMemo(()=>item.kind==='幻灯片'?deckFor(item):null,[item]);
 const go=useCallback((n:number)=>{if(!deck)return;const v=Math.min(Math.max(n,0),deck.length-1);setIdx(v);onProgress?.(deck.length>1?v/(deck.length-1):1)},[deck,onProgress]);
 const onKey=useEffectEvent((e:KeyboardEvent)=>{
  if(e.key==='ArrowRight')go(idx+1);
  if(e.key==='ArrowLeft')go(idx-1);
 });
 const isDeck=deck!==null;
 useEffect(()=>{
  if(!isDeck)return;
  const handleKey=(e:KeyboardEvent)=>onKey(e);
  window.addEventListener('keydown',handleKey);
  return()=>window.removeEventListener('keydown',handleKey);
 },[isDeck]);
 if(deck)return <>
 <div className="deck"><div className="deck-slide"><span className="deck-eyebrow">PAPERPLANE · 演示正文</span><h2>{deck[idx].heading}</h2><ul>{deck[idx].points.map(p=><li key={p}>{p}</li>)}</ul><small className="deck-page">{idx+1} / {deck.length}</small></div><div className="deck-nav"><Button variant="outline" size="sm" disabled={idx===0} onClick={()=>go(idx-1)}><ChevronLeft size={15}/>上一页</Button><span>{idx+1} / {deck.length}</span><Button variant="outline" size="sm" disabled={idx===deck.length-1} onClick={()=>go(idx+1)}>下一页<ChevronRight size={15}/></Button></div></div>
 {item.related&&item.related.length>0&&<section className="related-section"><h3>关联内容</h3>{item.related.map(rel=><RelatedBlock key={rel.file+rel.as} rel={rel} items={items}/>)}</section>}
 </>;
 const article=articleFor(item);
 return <article className="article"><h1 className="article-title">{item.title}</h1><nav className="article-nav">{article.map((s,i)=><a key={s.heading} href={`#sec-${i}`}>{s.heading}</a>)}</nav>{article.map((s,i)=><section key={s.heading} id={`sec-${i}`}><h2>{s.heading}</h2>{s.paras.map(p=><p key={p.slice(0,12)}>{p}</p>)}{i===1&&item.related?.filter(r=>r.as==='embed').map(rel=><RelatedBlock key={rel.file} rel={rel} items={items}/>)}</section>)}{item.related&&item.related.some(r=>r.as==='link')&&<section className="related-section"><h3>关联内容</h3>{item.related.filter(r=>r.as==='link').map(rel=><RelatedBlock key={rel.file} rel={rel} items={items}/>)}</section>}</article>;
}
