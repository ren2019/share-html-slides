'use client';
import { useEffect, useSyncExternalStore } from 'react';

export type Related={file:string;as:'link'|'embed'};
export type Material={id:number;title:string;file:string;kind:string;created:string;updated:string;revision:number;stopped:boolean;download:boolean;related?:Related[]};
export type Stage='choose'|'analyzing'|'missing'|'ready'|'publishing'|'done';
export type Auth={loggedIn:boolean;name:string;method:string};
export const themes=[['松烟墨','#a3a3a3','#171717','ink'],['沧海蓝','#3975b8','#051c2c','ocean'],['暮山紫','#cf62ff','#57008f','dusk'],['竹简青','#58d68d','#07532c','bamboo'],['霁空蓝','#78a9ff','#0f62fe','sky']] as const;

export const initialMaterials:Material[]=[
{id:3,title:'从洞察到行动：增长策略分享',file:'增长策略.html',kind:'幻灯片',created:'2026-09-08 14:03',updated:'2026-09-13 10:42',revision:3,stopped:false,download:true,related:[{file:'案例解读.html',as:'link'},{file:'数据说明.html',as:'embed'}]},
{id:2,title:'产品需求说明',file:'产品思考.html',kind:'长网页',created:'2026-09-09 11:26',updated:'2026-09-12 16:20',revision:2,stopped:false,download:true,related:[{file:'品牌沟通.html',as:'embed'}]},
{id:1,title:'品牌规范 v1.0',file:'品牌沟通.html',kind:'幻灯片',created:'2026-09-05 09:12',updated:'2026-09-10 09:35',revision:2,stopped:true,download:false},
];

export const externalFails=[{url:'cdn.static.example/deck-serif.css',note:'外部样式'},{url:'img.cdn.example/cover-photo.png',note:'外部图片'}];
export const localAssets=[{path:'assets/cover.png',note:'封面图'},{path:'assets/deck.css',note:'样式'},{path:'assets/chart.js',note:'图表脚本'}];
export type FailCase='none'|'related'|'main';

type LibState={items:Material[];upload:boolean;stage:Stage;partial:boolean;theme:number;auth:Auth;authCfg:{wechat:boolean;sms:boolean};opsFail:boolean;failCase:FailCase;failedFiles:string[]};
const initialState:LibState={items:initialMaterials,upload:false,stage:'choose',partial:false,theme:0,auth:{loggedIn:false,name:'',method:''},authCfg:{wechat:true,sms:true},opsFail:false,failCase:'none',failedFiles:[]};
let state=initialState;
const listeners=new Set<()=>void>();
export function setState(patch:Partial<LibState>){state={...state,...patch};listeners.forEach(l=>l())}
const subscribe=(cb:()=>void)=>{listeners.add(cb);return()=>{listeners.delete(cb)}};
export function useLibrary(){return useSyncExternalStore(subscribe,()=>state,()=>initialState)}

export function useThemeSync(){
 const {theme}=useLibrary();
 useEffect(()=>{try{const s=localStorage.getItem('paperplane-theme');const i=themes.findIndex(t=>t[3]===s);if(i>0&&i!==state.theme)setState({theme:i})}catch{}},[]);
 useEffect(()=>{document.documentElement.dataset.theme=themes[theme][3];try{localStorage.setItem('paperplane-theme',themes[theme][3])}catch{}},[theme]);
}

let nextId=4;
const upsert=(old:Material[],file:string,title:string,kind:string,now:string):Material[]=>{
 const ex=old.find(i=>i.file===file);
 if(ex)return old.map(i=>i.file===file?{...i,updated:now,revision:i.revision+1}:i);
 return [{id:nextId++,title,file,kind,created:now,updated:now,revision:1,stopped:false,download:true},...old];
};
const fmtNow=()=>{const d=new Date();const p=(n:number)=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`};
export function publishMaterials(incomplete:boolean,fail:string[]=[]){
 const now=fmtNow();
 let next=state.items;
 if(!incomplete){
  if(!fail.includes('数据说明.html'))next=upsert(next,'数据说明.html','数据说明','长网页',now);
  if(!fail.includes('案例解读.html'))next=upsert(next,'案例解读.html','案例解读','长网页',now);
 }
 next=fail.includes('增长策略.html')?next:upsert(next,'增长策略.html','从洞察到行动：增长策略分享','幻灯片',now);
 setState({items:next});
}
export function retryMaterial(file:string,title:string,kind:string){
 setState({items:upsert(state.items,file,title,kind,fmtNow())});
}

export function embedHtml(t:Material){
 const base='font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;margin:0;padding:16px 18px;font-size:13px;color:#3d4854';
 if(t.stopped)return `<!doctype html><html><body style="${base}"><p style="color:#8b754c;font-size:12px;margin:8px 0">关联材料已停止分享，恢复后可继续阅读。</p></body></html>`;
 const excerpt=t.kind==='幻灯片'?deckFor(t)[1].heading+'：'+deckFor(t)[1].points[0]:articleFor(t)[0].paras[1];
 return `<!doctype html><html><body style="${base}"><div style="display:flex;gap:8px;align-items:baseline"><strong style="font-size:13px;flex:1">${t.title}</strong><span style="font-size:10px;color:#8d97a1">r${t.revision} · ${t.kind}</span></div><p style="font-size:12px;line-height:1.9;color:#5a6a78;margin:10px 0">${excerpt}</p></body></html>`;
}

const deckTopics:[string,string[]][]=[
 ['背景与目标',['本次分享覆盖的范围与读者','目标：把结论转化为可执行的下一步']],
 ['现状与关键数据',['核心指标最近两个季度的变化','与预期差距最大的三个环节']],
 ['关键判断',['判断一：增长主要来自存量深挖','判断二：新渠道贡献仍待验证']],
 ['执行计划',['第 1 阶段：两周内完成基线梳理','第 2 阶段：按月复盘并调整资源']],
 ['风险与对策',['数据口径不一致：先统一指标定义','人力紧张：明确优先级，砍低价值事项']],
 ['下一步与分工',['负责人与时间节点','下次检查点：两周后']],
];
export function deckFor(m:Material){
 const cover={heading:m.title,points:[`${m.kind} · 演示正文`,`版本 r${m.revision} · 更新于 ${m.updated}`]};
 return [cover,...deckTopics.map(([heading,points])=>({heading,points}))];
}

const articleTopics:[string,string[]][]=[
 ['为什么做这份梳理',['这份文档记录当前阶段的背景、约束与已经确认的结论，供后续执行时对照。','文中的判断都基于当前可得的信息，信息变化时应更新而不是沿用旧结论。']],
 ['现状与约束',['现有流程中最明显的瓶颈集中在信息同步与优先级对齐两个环节。','资源有限是常态，本节的约束清单用于在做取舍时快速核对。']],
 ['方案与取舍',['方案按投入与预期收益排序，先做自己就能闭环的部分。','被放弃的选项记录在案，包括放弃的原因，避免下次重新争论。']],
 ['执行安排',['每一项安排都有明确的负责人和检查点，检查点比截止日期更重要。','跨角色协同时，先在检查点对齐口径，再各自推进。']],
 ['附录：版本说明',['本页为演示正文。','引用与关联内容在正文相应位置标注。']],
];
export function articleFor(m:Material){
 return articleTopics.map(([heading,paras],i)=>({heading,paras:i===0?[`版本 r${m.revision} · 更新于 ${m.updated} · 演示正文`,...paras]:paras}));
}
