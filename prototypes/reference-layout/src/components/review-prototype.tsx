'use client';
// THROWAWAY: three review layouts on /read/[id]?variant=A|B|C. Memory only.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MessageSquare, X, Check, CornerDownRight, TextSelect } from 'lucide-react';
import './review-prototype.css';

type Comment = {id:number;by:string;text:string;quote:string;kind:string;version:number;resolved:boolean;replies:{id:number;by:string;text:string}[]};
const segmenter=new Intl.Segmenter('zh',{granularity:'grapheme'});
const names = {A:'轻入口 · 底部面板',B:'段落入口 · 就地批注',C:'双栏 · 评论工作区'};
const sample:Comment[]=[{id:1,by:'访客 A',text:'这里能补一个具体例子吗？',quote:'这份文档记录当前阶段的背景、约束与已经确认的结论，供后续执行时对照。',kind:'段落',version:2,resolved:false,replies:[{id:101,by:'发布者',text:'可以，下一版会补上实际案例。'}]},{id:2,by:'访客 B',text:'整体结构很清楚，建议增加一页总结。',quote:'',kind:'整份材料',version:2,resolved:false,replies:[]}];

export function PrototypeSwitcher({variant,onBeforeSwitch}:{variant:keyof typeof names;onBeforeSwitch:()=>void}){
 const router=useRouter(),path=usePathname(),params=useSearchParams();
 const move=(delta:number)=>{const keys=Object.keys(names) as (keyof typeof names)[];const next=keys[(keys.indexOf(variant)+delta+3)%3];const p=new URLSearchParams(params.toString());p.set('variant',next);onBeforeSwitch();router.replace(`${path}?${p}`,{scroll:false});};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement).closest('input,textarea,select,[contenteditable]')||e.altKey||e.metaKey||e.ctrlKey)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopImmediatePropagation();move(e.key==='ArrowRight'?1:-1)}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true)});
 if(process.env.NODE_ENV==='production')return null;
 return <nav className="rp-switch" aria-label="原型方案切换"><button onClick={()=>move(-1)} aria-label="上一方案"><ChevronLeft size={17}/></button><span>{variant} · {names[variant]}</span><button onClick={()=>move(1)} aria-label="下一方案"><ChevronRight size={17}/></button></nav>;
}
export function ReviewPrototype({children,initialVersion}:{children:ReactNode;initialVersion:number}){
 const params=useSearchParams();const raw=params.get('variant');const variant:keyof typeof names=raw==='B'||raw==='C'?raw:'A';
 const [reviewEnabled,setReviewEnabled]=useState(false);
 const [role,setRole]=useState('访客 A'),[allowed,setAllowed]=useState(true),[version,setVersion]=useState(initialVersion);
 const [comments,setComments]=useState<Comment[]>(sample),[count,setCount]=useState(2),[open,setOpen]=useState(false),[picking,setPicking]=useState(false);
 const [quote,setQuote]=useState(''),[kind,setKind]=useState('整份材料'),[draft,setDraft]=useState(''),[reply,setReply]=useState<number|null>(null),[notice,setNotice]=useState(''),[pendingOnly,setPendingOnly]=useState(false);
 const root=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null),readingY=useRef(0);
 const close=()=>{setOpen(false);requestAnimationFrame(()=>window.scrollTo({top:readingY.current,behavior:'instant'}))};
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),2500);return()=>clearTimeout(timer)},[notice]);
 const owner=role==='发布者',canWrite=owner||(allowed&&count<100);
 const visible=comments.filter(c=>(owner||c.by===role)&&(!pendingOnly||!c.resolved));
 const length=Array.from(segmenter.segment(draft)).length;
 useEffect(()=>{const selected=()=>{const selection=window.getSelection();if(!selection||selection.isCollapsed||!root.current?.contains(selection.anchorNode)||!root.current?.contains(selection.focusNode))return;const node=selection.anchorNode?.parentElement;if(!node?.closest('.article,.deck-slide'))return;setQuote(selection.toString().trim());setKind('划词');setReply(null);};document.addEventListener('selectionchange',selected);return()=>document.removeEventListener('selectionchange',selected)},[]);
 const compose=(text='',type='整份材料',id:number|null=null)=>{readingY.current=window.scrollY;setQuote(text);setKind(type);setReply(id);setPicking(false);setOpen(true);setNotice('');requestAnimationFrame(()=>input.current?.focus())};
 const send=()=>{if(!canWrite||!draft.trim()||length>1000)return;if(reply!==null)setComments(comments.map(c=>c.id===reply?{...c,replies:[...c.replies,{id:Date.now(),by:role,text:draft}]}:c));else setComments([...comments,{id:Date.now(),by:role,text:draft,quote,kind,version,resolved:false,replies:[]}]);if(!owner)setCount(count+1);setDraft('');setQuote('');setReply(null);close();setNotice('已发送');window.getSelection()?.removeAllRanges()};
 const controls=<><button onClick={()=>compose()} disabled={!canWrite}><MessageSquare size={16}/>写评论</button><button onClick={()=>{setPicking(!picking);setOpen(false);setQuote('');}} disabled={!canWrite}><TextSelect size={16}/>{picking?'取消选段':'选段评论'}</button><button onClick={()=>{readingY.current=window.scrollY;setOpen(!open)}}>查看{owner?'全部':'我的'}评论 ({visible.length})</button></>;
 const panel=<section className="rp-panel" aria-label="评论面板"><header><div><strong>{owner?'审阅意见':'我的评论'}</strong><small>{owner?'仅发布者可见全部意见':'只有你和发布者能看到'}</small></div><button aria-label="关闭评论" onClick={close}><X size={18}/></button></header>{owner&&<label className="rp-filter"><input type="checkbox" checked={pendingOnly} onChange={e=>setPendingOnly(e.target.checked)}/>只看待处理</label>}<div className="rp-comments">{visible.length===0&&<p className="rp-empty">还没有评论。选一段内容，或直接写下整体意见。</p>}{visible.map(c=><article className="rp-comment" key={c.id}><div className="rp-meta"><b>{c.by}</b><span>{c.resolved?'已解决':'待处理'} · r{c.version}{c.version!==version?' · 旧版本':''}</span></div>{c.quote&&<blockquote>{c.quote}</blockquote>}<p>{c.text}</p>{c.replies.map(r=><div className="rp-reply" key={r.id}><small>{r.by}</small><p>{r.text}</p></div>)}<div className="rp-actions"><button disabled={!canWrite} onClick={()=>compose(c.quote,c.kind,c.id)}><CornerDownRight size={13}/>回复</button>{owner&&<button onClick={()=>setComments(comments.map(x=>x.id===c.id?{...x,resolved:!x.resolved}:x))}><Check size={13}/>{c.resolved?'重新打开':'解决'}</button>}</div></article>)}</div><div className="rp-composer">{quote&&<blockquote><small>{reply?'回复 · ':''}{kind}</small>{quote}</blockquote>}<label htmlFor="rp-draft">{reply?'补充回复':quote?'针对这段内容':'对整份材料的意见'}</label><textarea id="rp-draft" ref={input} rows={3} placeholder={canWrite?'写下你的意见…':allowed?'本材料匿名评论已满':'发布者已关闭评论'} value={draft} disabled={!canWrite} onChange={e=>setDraft(e.target.value)}/><div><small className={length>1000?'rp-error':''}>{length}/1000 · 无需登录</small><button className="rp-primary" disabled={!canWrite||!draft.trim()||length>1000} onClick={send}>发送</button></div></div></section>;
 return <div className={`rp-root rp-${variant}`}>
 <aside className="rp-lab"><details><summary>审阅原型 · {variant} · {role} · r{version} · 匿名 {count}/100</summary><p>临时内存演示；刷新重置。默认演示已开启评论，真实设置默认关闭。版本按钮仅模拟评论版本变化。</p><div className="rp-lab-controls"><label>模拟身份 <select value={role} onChange={e=>{setRole(e.target.value);setDraft('');setQuote('');setReply(null)}}><option>访客 A</option><option>访客 B</option><option>发布者</option></select></label><label><input type="checkbox" checked={allowed} onChange={e=>setAllowed(e.target.checked)}/>允许评论</label><button onClick={()=>setVersion(version+1)}>模拟更新</button><button onClick={()=>setCount(count===100?2:100)}>{count===100?'恢复演示额度':'模拟满额'}</button></div><pre>{JSON.stringify({variant,reviewEnabled,role,allowed,version,count,picking,quote,reply,comments},null,2)}</pre></details></aside>
 {variant==='B'&&<div className="rp-inline-tools">{controls}</div>}
 {variant==='C'&&<div className="rp-workspace-tools"><strong>审阅工作区</strong>{controls}</div>}
 {picking&&<div className="rp-pick-hint">点一下正文段落，为这一段添加评论 <button onClick={()=>setPicking(false)}>取消</button></div>}
 <div className="rp-layout"><div ref={root} className={`rp-document ${picking?'rp-picking':''} ${variant==='B'&&picking?'rp-paragraphs':''}`} onKeyDownCapture={e=>{if(!picking||e.key!=="Enter")return;const selection=window.getSelection()?.toString().trim();if(selection){e.preventDefault();compose(selection,"划词")}}} onClickCapture={e=>{if(!picking)return;const target=(e.target as HTMLElement).closest('.article p,.article h2,.deck-slide li,.deck-slide h2');if(target){e.preventDefault();e.stopPropagation();compose(target.textContent||'','段落')}}}>{children}</div>{(open||variant==='C')&&<div className={`rp-panel-host ${open?'rp-open':''}`}>{panel}</div>}</div>
 {quote&&!open&&canWrite&&(variant!=='A'||reviewEnabled)&&<button className="rp-selection rp-primary" onMouseDown={e=>e.preventDefault()} onClick={()=>{readingY.current=window.scrollY;setOpen(true);setPicking(false);requestAnimationFrame(()=>input.current?.focus())}}>评论选中文字</button>}
 {variant==='A'&&<div className={`rp-dock ${reviewEnabled?'':'rp-dock-collapsed'}`}>{reviewEnabled?<>{controls}<button aria-label="收起评论工具" title="收起评论工具" onClick={()=>{setReviewEnabled(false);setPicking(false);setQuote('');if(open)close()}}><X size={16}/></button></>:<button aria-expanded={false} onClick={()=>setReviewEnabled(true)}><MessageSquare size={16}/>评论</button>}</div>}
 {variant==='B'&&!picking&&<button className="rp-margin-button" disabled={!canWrite} onClick={()=>setPicking(true)} aria-label="选择段落评论"><MessageSquare size={20}/><span>选段</span></button>}
 {notice&&<div className="rp-notice" role="status">{notice}</div>}
 <PrototypeSwitcher variant={variant} onBeforeSwitch={()=>{setOpen(false);setPicking(false);setQuote('');setReviewEnabled(false)}}/>
 </div>;
}
