'use client';
import { Check, ChevronDown, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { themes, useLibrary, setState } from '@/lib/library';

export function ThemeMenu(){
 const {theme}=useLibrary();
 return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="theme-trigger"><Palette size={16}/>{themes[theme][0]}<ChevronDown size={13}/></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{themes.map((t,i)=><DropdownMenuItem key={t[0]} onSelect={()=>setState({theme:i})}><span className="swatch" style={{background:`linear-gradient(135deg,${t[1]},${t[2]})`}}/>{t[0]}{theme===i&&<Check className="ml-auto" size={14}/>}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;
}
