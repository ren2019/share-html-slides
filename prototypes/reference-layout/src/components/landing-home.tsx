'use client';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, FileCode2, FolderOpen, Link2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrigamiMark } from '@/components/origami-mark';
import { ThemeMenu } from '@/components/theme-menu';

const points=[
 {icon:FolderOpen,title:'检查关联文件',desc:'上传已有 HTML 幻灯片或长网页，自动列出缺失的图片、样式与关联页面，补齐后再发布。'},
 {icon:Link2,title:'同名更新，链接不变',desc:'再次上传同名文件自动更新内容，已发出的阅读链接继续可用。'},
 {icon:FileCode2,title:'读者免登录',desc:'阅读与分享不需要账号；关联 HTML 各自独立发布，可分别管理。'},
];

export default function LandingHome(){
 return <div className="shell">
 <header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="纸飞机"><OrigamiMark/><span>纸飞机<small>PAPERPLANE</small></span></Link><div className="header-actions"><ThemeMenu/><Button className="brand-button" asChild><Link href="/login"><LogIn/>登录并上传</Link></Button></div></div></header>
 <main className="workspace landing">
 <section className="landing-hero">
 <h1>发布 HTML，分享阅读链接</h1>
 <p>纸飞机把已有的 HTML 幻灯片和长网页发布为带稳定链接的材料：上传时检查关联文件，同名更新不改变链接，读者打开链接即可免登录阅读与转发。</p>
 <div className="landing-cta"><Button className="brand-button" size="lg" asChild><Link href="/login">登录并上传 <ArrowRight/></Link></Button><Button variant="outline" size="lg" asChild><a href="#demo">查看公开演示材料</a></Button></div>
 </section>
 <section className="landing-demo" id="demo">
 <Link className="demo-card" href="/read/3"><span className="demo-kind">幻灯片示例</span><strong>可翻页的 HTML slides</strong><span className="demo-desc">分页翻阅、键盘左右切换，关联页面可继续打开。</span><span className="demo-open">打开阅读 <ArrowUpRight size={14}/></span></Link>
 <Link className="demo-card" href="/read/2"><span className="demo-kind">长网页示例</span><strong>可滚动的 HTML 长页</strong><span className="demo-desc">连续滚动与页内锚点，嵌入关联内容局部可用。</span><span className="demo-open">打开阅读 <ArrowUpRight size={14}/></span></Link>
 </section>
 <section className="landing-points">{points.map(p=><div className="point" key={p.title}><p.icon size={18}/><strong>{p.title}</strong><p>{p.desc}</p></div>)}</section>
 <section className="landing-note">
 <p>开源项目，面向自托管部署；当前提供交互原型。代码见 <a href="https://github.com/ren2019/share-html-slides" target="_blank" rel="noreferrer">github.com/ren2019/share-html-slides</a>。</p>
 <p>演示材料为合成内容，认证、上传与存储均为模拟，不产生真实发布。</p>
 </section>
 </main>
 </div>
}
