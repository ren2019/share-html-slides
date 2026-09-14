'use client';
import { useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

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
   plane.style.transform=`translate(${(p.x/200)*r.width-7}px,${(p.y/24)*r.height-7}px)`;
  };
  place();
  window.addEventListener('resize',place);
  return()=>window.removeEventListener('resize',place);
 },[progress]);
 return <div className="read-track" aria-hidden ref={wrapRef}>
 <svg viewBox="0 0 200 24" preserveAspectRatio="none"><path ref={pathRef} d="M4 12 C 40 3, 62 21, 100 12 S 160 3, 196 12" fill="none" className="track-wave"/></svg>
 <span ref={planeRef} className="track-plane"><Send size={13}/></span>
 </div>;
}
