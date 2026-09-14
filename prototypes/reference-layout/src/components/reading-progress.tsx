'use client';
import { useEffect, useRef } from 'react';

function PaperPlane(){
 return <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden focusable="false">
 <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" fill="currentColor" stroke="none"/>
 <path d="m21.854 2.147-10.94 10.939" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
 </svg>;
}

export function ReadingTrack({progress}:{progress:number}){
 const wrapRef=useRef<HTMLDivElement>(null),pathRef=useRef<SVGPathElement>(null),planeRef=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const place=()=>{
   const wrap=wrapRef.current,path=pathRef.current,plane=planeRef.current;
   if(!wrap||!path||plane===null)return;
   const t=Math.min(1,Math.max(0,progress));
   const len=path.getTotalLength();
   const p=path.getPointAtLength(t*len);
   const r=wrap.getBoundingClientRect();
   plane.style.transform=`translate(${(p.x/200)*r.width-9}px,${(p.y/30)*r.height-9}px)`;
  };
  place();
  window.addEventListener('resize',place);
  return()=>window.removeEventListener('resize',place);
 },[progress]);
 return <div className="read-track" aria-hidden ref={wrapRef}>
 <svg viewBox="0 0 200 30" preserveAspectRatio="none"><path ref={pathRef} d="M5 15 C 40 6, 62 24, 100 15 S 160 6, 195 15" fill="none" className="track-wave"/></svg>
 <span ref={planeRef} className="track-plane"><PaperPlane/></span>
 </div>;
}
