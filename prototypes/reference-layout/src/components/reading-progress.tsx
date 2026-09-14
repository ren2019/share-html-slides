'use client';
import { useEffect, useRef } from 'react';
import { OrigamiMark } from '@/components/origami-mark';

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
 <span ref={planeRef} className="track-plane"><OrigamiMark/></span>
 </div>;
}
