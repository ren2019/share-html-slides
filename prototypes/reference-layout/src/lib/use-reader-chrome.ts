'use client';
import { useEffect, useRef, useState } from 'react';

// Only short, unselected taps on non-interactive content toggle reader chrome.
export function useReaderChrome(enabled:boolean, materialId:string){
 const mainRef=useRef<HTMLElement>(null);
 const [hidden,setHidden]=useState(false);
 useEffect(()=>{
  setHidden(false);
  const main=mainRef.current;
  if(!enabled||!main)return;
  let start:{x:number;y:number;time:number}|null=null;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const cancel=()=>{start=null;clearTimeout(timer)};
  const down=(event:PointerEvent)=>{
   clearTimeout(timer);
   start=event.isPrimary&&event.button===0?{x:event.clientX,y:event.clientY,time:Date.now()}:null;
  };
  const click=(event:MouseEvent)=>{
   const origin=start;
   start=null;
   clearTimeout(timer);
   if(!origin||event.detail!==1||Date.now()-origin.time>400)return;
   if(Math.hypot(event.clientX-origin.x,event.clientY-origin.y)>8)return;
   const target=event.target;
   if(!(target instanceof Element)||!target.closest('.article,.deck-slide'))return;
   if(target.closest('a,button,input,textarea,select,label,summary,[role="button"],[role="link"],[contenteditable]:not([contenteditable="false"]),video,audio,iframe'))return;
   if(event.clientX<innerWidth*.2||event.clientX>innerWidth*.8||event.clientY<innerHeight*.2||event.clientY>innerHeight*.8)return;
   timer=setTimeout(()=>{
    if(!window.getSelection()?.toString())setHidden(value=>!value);
   },240);
  };
  const show=(event:KeyboardEvent)=>{if(event.key==='Escape'||event.key==='Tab'){clearTimeout(timer);setHidden(false)}};
  main.addEventListener('pointerdown',down);
  main.addEventListener('pointercancel',cancel);
  main.addEventListener('click',click);
  window.addEventListener('scroll',cancel,{passive:true});
  window.addEventListener('keydown',show);
  return()=>{
   cancel();
   main.removeEventListener('pointerdown',down);
   main.removeEventListener('pointercancel',cancel);
   main.removeEventListener('click',click);
   window.removeEventListener('scroll',cancel);
   window.removeEventListener('keydown',show);
  };
 },[enabled,materialId]);
 return {hidden,mainRef};
}
