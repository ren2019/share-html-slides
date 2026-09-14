'use client';
import { useEffect, useSyncExternalStore } from 'react';

export type Material={id:number;title:string;file:string;kind:string;created:string;updated:string;revision:number;stopped:boolean;download:boolean};
export type Stage='choose'|'missing'|'ready'|'publishing'|'done';
export const themes=[['松烟墨','#a3a3a3','#171717','ink'],['沧海蓝','#3975b8','#051c2c','ocean'],['暮山紫','#cf62ff','#57008f','dusk'],['竹简青','#58d68d','#07532c','bamboo'],['霁空蓝','#78a9ff','#0f62fe','sky']] as const;

export const initialMaterials:Material[]=[
{id:3,title:'从洞察到行动：增长策略分享',file:'增长策略.html',kind:'幻灯片',created:'2026-09-08 14:03',updated:'2026-09-13 10:42',revision:3,stopped:false,download:true},
{id:2,title:'产品需求说明',file:'产品思考.html',kind:'长网页',created:'2026-09-09 11:26',updated:'2026-09-12 16:20',revision:2,stopped:false,download:true},
{id:1,title:'品牌规范 v1.0',file:'品牌沟通.html',kind:'幻灯片',created:'2026-09-05 09:12',updated:'2026-09-10 09:35',revision:2,stopped:true,download:false},
];

type LibState={items:Material[];upload:boolean;stage:Stage;partial:boolean;theme:number};
const initialState:LibState={items:initialMaterials,upload:false,stage:'choose',partial:false,theme:0};
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

const upsert=(old:Material[],file:string,title:string,kind:string,now:string):Material[]=>{
 const ex=old.find(i=>i.file===file);
 if(ex)return old.map(i=>i.file===file?{...i,updated:now,revision:i.revision+1}:i);
 const id=Math.max(0,...old.map(i=>i.id))+1;
 return [{id,title,file,kind,created:now,updated:now,revision:1,stopped:false,download:true},...old];
};
const fmtNow=()=>{const d=new Date();const p=(n:number)=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`};
export function publishMaterials(incomplete:boolean){
 const now=fmtNow();
 let next=state.items;
 if(!incomplete){next=upsert(next,'数据说明.html','数据说明','长网页',now);next=upsert(next,'案例解读.html','案例解读','长网页',now)}
 next=upsert(next,'增长策略.html','从洞察到行动：增长策略分享','幻灯片',now);
 setState({items:next});
}
