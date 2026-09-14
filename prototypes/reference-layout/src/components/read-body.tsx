'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, CircleAlert, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function ReadContent({item,items,missing,loggedIn}:{item:Material;items:Material[];missing:boolean;loggedIn:boolean}){
 return <>
 <ReadBody item={item} items={items}/>
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
 <footer className="reader-footer">{loggedIn?<Link href="/">返回材料库</Link>:<><Button asChild className="brand-button reader-cta-mobile"><Link href="/">使用纸飞机</Link></Button><Link href="/" className="reader-cta-desktop">了解纸飞机</Link></>}</footer>
 </>;
}

export function ReadBody({item,items}:{item:Material;items:Material[]}){
 const [idx,setIdx]=useState(0);
 const deck=item.kind==='幻灯片'?deckFor(item):null;
 useEffect(()=>{if(!deck)return;const h=(e:KeyboardEvent)=>{if(e.key==='ArrowRight')setIdx(i=>Math.min(i+1,deck.length-1));if(e.key==='ArrowLeft')setIdx(i=>Math.max(i-1,0))};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[deck]);
 if(deck)return <>
 <div className="deck"><div className="deck-slide"><span className="deck-eyebrow">PAPERPLANE · 演示正文</span><h2>{deck[idx].heading}</h2><ul>{deck[idx].points.map(p=><li key={p}>{p}</li>)}</ul><small className="deck-page">{idx+1} / {deck.length}</small></div><div className="deck-nav"><Button variant="outline" size="sm" disabled={idx===0} onClick={()=>setIdx(idx-1)}><ChevronLeft size={15}/>上一页</Button><span>{idx+1} / {deck.length}</span><Button variant="outline" size="sm" disabled={idx===deck.length-1} onClick={()=>setIdx(idx+1)}>下一页<ChevronRight size={15}/></Button></div></div>
 {item.related&&item.related.length>0&&<section className="related-section"><h3>关联内容</h3>{item.related.map(rel=><RelatedBlock key={rel.file+rel.as} rel={rel} items={items}/>)}</section>}
 </>;
 const article=articleFor(item);
 return <article className="article"><h1 className="article-title">{item.title}</h1><nav className="article-nav">{article.map((s,i)=><a key={s.heading} href={`#sec-${i}`}>{s.heading}</a>)}</nav>{article.map((s,i)=><section key={s.heading} id={`sec-${i}`}><h2>{s.heading}</h2>{s.paras.map(p=><p key={p.slice(0,12)}>{p}</p>)}{i===1&&item.related?.filter(r=>r.as==='embed').map(rel=><RelatedBlock key={rel.file} rel={rel} items={items}/>)}</section>)}{item.related&&item.related.some(r=>r.as==='link')&&<section className="related-section"><h3>关联内容</h3>{item.related.filter(r=>r.as==='link').map(rel=><RelatedBlock key={rel.file} rel={rel} items={items}/>)}</section>}</article>;
}
