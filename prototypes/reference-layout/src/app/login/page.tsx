'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CircleAlert, CircleCheck, Loader2, QrCode, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrigamiMark } from '@/components/origami-mark';
import { useLibrary, useThemeSync, setState } from '@/lib/library';

type Mode='login'|'register'|'reset';
type Qr='idle'|'ok'|'cancel'|'expired'|'fail';
const DEMO_CODE='246810';
const DEMO_PHONE='10000000000';
const DEMO_PW='demo123';
const qrCells=(()=>{let s=42;const rnd=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648};return Array.from({length:144},(_,i)=>i<8||i>135||i%12<2?true:rnd()>0.52)})();
const maskPhone=(p:string)=>p.replace(/^(\d{3})\d{4}(\d{4})$/,'$1****$2');
const checkPw=(ok:boolean,pw:string,pw2:string)=>!ok?'请先完成手机号验证':pw.length<6?'密码至少 6 位':pw!==pw2?'两次输入的密码不一致':'';

function PasswordPair({verified,pw,pw2,onPw,onPw2,new_}:{verified:boolean;pw:string;pw2:string;onPw:(v:string)=>void;onPw2:(v:string)=>void;new_?:boolean}){
 return <>
 <Input aria-label={new_?'新密码':'设置密码'} type="password" placeholder={new_?'新密码（至少 6 位）':'设置密码（至少 6 位）'} value={pw} onChange={e=>onPw(e.target.value)} disabled={!verified}/>
 <Input aria-label={new_?'确认新密码':'确认密码'} type="password" placeholder={new_?'确认新密码':'确认密码'} value={pw2} onChange={e=>onPw2(e.target.value)} disabled={!verified}/>
 {!verified&&<p className="demo-hint">先完成手机号验证，再设置密码。</p>}
 </>
}

function SmsVerify({phone,onVerified}:{phone:string;onVerified:()=>void}){
 const [sentAt,setSentAt]=useState(0),[left,setLeft]=useState(0),[code,setCode]=useState(''),[err,setErr]=useState(''),[ok,setOk]=useState(false);
 useEffect(()=>{if(!sentAt)return;const t=setInterval(()=>{const l=Math.max(0,30-Math.floor((Date.now()-sentAt)/1000));setLeft(l);if(l===0)clearInterval(t)},500);return()=>clearInterval(t)},[sentAt]);
 const valid=/^1\d{10}$/.test(phone);
 const send=()=>{setSentAt(Date.now());setLeft(30);setErr('');setCode('');setOk(false)};
 const verify=()=>{
  if(!sentAt){setErr('请先发送验证码');return}
  if(Date.now()-sentAt>30000){setErr('验证码已过期，请重新发送');return}
  if(code!==DEMO_CODE){setErr('验证码不正确，请重试');return}
  setOk(true);setErr('');onVerified();
 };
 return <div className="sms-block">
 <div className="field-row"><Input aria-label="短信验证码" placeholder="短信验证码" value={code} onChange={e=>setCode(e.target.value)} disabled={ok}/>{ok?<span className="sms-ok"><CircleCheck size={15}/>已验证</span>:<Button variant="outline" onClick={send} disabled={!valid||left>0}>{left>0?`重发（${left}s）`:'发送验证码'}</Button>}</div>
 {sentAt>0&&!ok&&<p className="demo-hint">演示验证码：{DEMO_CODE}，30 秒内有效。<button className="linklike" onClick={()=>setSentAt(Date.now()-31000)}>模拟过期</button></p>}
 {!ok&&<Button variant="secondary" onClick={verify} disabled={!sentAt}>验证手机号</Button>}
 {err&&<p className="form-error"><CircleAlert size={14}/>{err}</p>}
 </div>
}

function RegisterForm({smsOn,onEnter}:{smsOn:boolean;onEnter:(name:string,method:string)=>void}){
 const [phone,setPhone]=useState(DEMO_PHONE),[ok,setOk]=useState(false),[pw,setPw]=useState(''),[pw2,setPw2]=useState(''),[err,setErr]=useState('');
 const submit=()=>{const v=checkPw(ok,pw,pw2);if(v){setErr(v);return}setErr('');onEnter(`用户 ${maskPhone(phone)}`,'手机号注册')};
 if(!smsOn)return <p className="method-off"><CircleAlert size={14}/>未配置短信服务，账密注册未开放（不能跳过手机号验证）。</p>;
 return <div className="form-col">
 <Input aria-label="手机号" placeholder="手机号" value={phone} onChange={e=>{setPhone(e.target.value);setOk(false)}}/>
 <SmsVerify key={'reg:'+phone} phone={phone} onVerified={()=>setOk(true)}/>
 <PasswordPair verified={ok} pw={pw} pw2={pw2} onPw={setPw} onPw2={setPw2}/>
 {err&&<p className="form-error"><CircleAlert size={14}/>{err}</p>}
 <Button className="brand-button" onClick={submit} disabled={!ok}>{ok?'注册并登录':'注册并登录（先完成手机号验证）'}</Button>
 </div>
}

function ResetForm({smsOn,onBack}:{smsOn:boolean;onBack:()=>void}){
 const [phone,setPhone]=useState(DEMO_PHONE),[ok,setOk]=useState(false),[pw,setPw]=useState(''),[pw2,setPw2]=useState(''),[err,setErr]=useState(''),[done,setDone]=useState(false);
 const submit=()=>{const v=checkPw(ok,pw,pw2);if(v){setErr(v);return}setErr('');setDone(true)};
 if(!smsOn)return <p className="method-off"><CircleAlert size={14}/>未配置短信服务，找回密码不可用。</p>;
 if(done)return <div className="auth-banner ok"><CircleCheck size={15}/>密码已重置（演示）。<button className="linklike" onClick={onBack}>返回登录</button></div>;
 return <div className="form-col">
 <Input aria-label="手机号" placeholder="手机号" value={phone} onChange={e=>{setPhone(e.target.value);setOk(false)}}/>
 <SmsVerify key={'rst:'+phone} phone={phone} onVerified={()=>setOk(true)}/>
 <PasswordPair verified={ok} pw={pw} pw2={pw2} onPw={setPw} onPw2={setPw2} new_/>
 {err&&<p className="form-error"><CircleAlert size={14}/>{err}</p>}
 <Button className="brand-button" onClick={submit} disabled={!ok}>{ok?'重置密码':'重置密码（先完成手机号验证）'}</Button>
 </div>
}

function QrPanel({onEnter}:{onEnter:(name:string,method:string)=>void}){
 const [qr,setQr]=useState<Qr>('idle');
 return <div className="qr-panel">
 <div className={`qr-box${qr==='expired'?' expired':''}`}><div className="qr-grid">{qrCells.map((c,i)=><i key={i} className={c?'on':''}/>)}</div>{qr==='expired'&&<button className="qr-refresh" onClick={()=>setQr('idle')}><RefreshCw size={14}/>二维码已过期，点击刷新</button>}</div>
 <div className="qr-side">
 <p className="qr-status">{qr==='idle'&&'等待手机微信扫码确认'}{qr==='ok'&&'已确认，正在进入…'}{qr==='cancel'&&'已取消扫码，可刷新后重试'}{qr==='expired'&&'二维码已过期'}{qr==='fail'&&'登录失败，请重试'}</p>
 {qr==='ok'&&<Loader2 size={17} className="spin"/>}
 <p className="demo-hint">演示操作：<button className="linklike" onClick={()=>{setQr('ok');setTimeout(()=>onEnter('微信演示用户','微信扫码'),600)}}>模拟扫码确认</button> · <button className="linklike" onClick={()=>setQr('cancel')}>模拟取消</button> · <button className="linklike" onClick={()=>setQr('expired')}>模拟过期</button> · <button className="linklike" onClick={()=>setQr('fail')}>模拟失败</button>{(qr==='cancel'||qr==='fail')&&<> · <button className="linklike" onClick={()=>setQr('idle')}>重试</button></>}</p>
 </div>
 </div>
}

function PhoneLogin({onEnter}:{onEnter:(name:string,method:string)=>void}){
 const [phone,setPhone]=useState(DEMO_PHONE),[pw,setPw]=useState(DEMO_PW),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const submit=()=>{
  if(!/^1\d{10}$/.test(phone)){setErr('请输入 11 位手机号（演示校验）');return}
  if(pw==='wrong'){setErr('手机号或密码不正确，请重试（演示失败态）');return}
  if(pw.length<6){setErr('密码至少 6 位');return}
  setBusy(true);setErr('');setTimeout(()=>onEnter(`用户 ${maskPhone(phone)}`,'手机号密码'),500);
 };
 return <div className="form-col">
 <Input aria-label="手机号" placeholder="手机号" value={phone} onChange={e=>setPhone(e.target.value)}/>
 <Input aria-label="密码" type="password" placeholder="密码" value={pw} onChange={e=>setPw(e.target.value)}/>
 {err&&<p className="form-error"><CircleAlert size={14}/>{err}</p>}
 <Button className="brand-button" onClick={submit} disabled={busy}>{busy?'正在登录…':'登录'}</Button>
 <p className="demo-hint">预填合成演示账号，请勿输入真实信息；密码改为 wrong 演示失败重试。</p>
 </div>
}

export default function LoginPage(){
 useThemeSync();
 const router=useRouter();
 const {auth,authCfg}=useLibrary();
 const [mode,setMode]=useState<Mode>('login');
 const enter=(name:string,method:string)=>{setState({auth:{loggedIn:true,name,method}});router.push('/')};
 const noneConfigured=!authCfg.wechat&&!authCfg.sms;
 return <div className="shell">
 <header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="纸飞机"><OrigamiMark/><span>纸飞机<small>PAPERPLANE</small></span></Link><div className="header-actions"><Link href="/" className="back-link"><ArrowLeft size={15}/>{auth.loggedIn?'返回材料库':'返回首页'}</Link></div></div></header>
 <main className="workspace auth-workspace">
 <div className="auth-card">
 <h1 className="auth-title">发布者登录</h1>
 <p className="auth-sub">匿名阅读与分享无需登录。本页为模拟认证：已预填合成演示账号（{DEMO_PHONE} / {DEMO_PW}），请勿输入真实手机号或密码，不发送真实短信。</p>
 {auth.loggedIn&&<div className="auth-banner ok"><CircleCheck size={15}/>已登录为 {auth.name}（{auth.method}）。<Link href="/">进入材料库</Link> 或 <button className="linklike" onClick={()=>setState({auth:{loggedIn:false,name:'',method:''}})}>退出登录</button></div>}
 {noneConfigured&&<div className="auth-banner warn"><CircleAlert size={15}/>当前演示部署未配置任何登录方式，发布者注册与登录未开放；匿名阅读分享不受影响。可在下方“演示部署配置”开启。</div>}
 <div className="auth-tabs" role="tablist">{([['login','登录'],['register','注册'],['reset','找回密码']] as [Mode,string][]).map(([v,l])=><button key={v} role="tab" aria-selected={mode===v} className={mode===v?'selected':''} onClick={()=>{if(v!==mode)setMode(v)}}>{l}</button>)}</div>
 {mode==='login'&&!noneConfigured&&<>
 <section className="auth-method"><h2><QrCode size={16}/>微信扫码</h2>
 {authCfg.wechat?<QrPanel onEnter={enter}/>:<p className="method-off"><CircleAlert size={14}/>当前部署未配置微信扫码登录。</p>}
 <p className="demo-hint">微信内置浏览器中请使用手机号密码登录，无需扫描本机二维码。</p></section>
 <section className="auth-method"><h2>手机号密码</h2>
 {authCfg.sms?<><PhoneLogin onEnter={enter}/><p className="auth-alt">没有账号？<button className="linklike" onClick={()=>setMode('register')}>手机号验证注册</button> · <button className="linklike" onClick={()=>setMode('reset')}>忘记密码</button></p></>:<p className="method-off"><CircleAlert size={14}/>未配置短信服务，手机号密码登录与注册未开放。</p>}
 </section>
 </>}
 {mode==='register'&&!noneConfigured&&<section className="auth-method"><h2>手机号验证注册</h2><RegisterForm key={'reg'+authCfg.sms} smsOn={authCfg.sms} onEnter={enter}/></section>}
 {mode==='reset'&&!noneConfigured&&<section className="auth-method"><h2>找回密码</h2><ResetForm key={'rst'+authCfg.sms} smsOn={authCfg.sms} onBack={()=>setMode('login')}/></section>}
 <details className="auth-config"><summary>演示部署配置</summary>
 <label><input type="checkbox" checked={authCfg.wechat} onChange={e=>setState({authCfg:{...authCfg,wechat:e.target.checked}})}/>微信扫码已配置</label>
 <label><input type="checkbox" checked={authCfg.sms} onChange={e=>setState({authCfg:{...authCfg,sms:e.target.checked}})}/>短信服务已配置</label>
 <p className="demo-hint">关闭任一方式可演示“未配置不开放”的界面状态：关短信同时关闭手机号密码登录、注册与找回；两种方式均关闭时注册登录整体不开放。</p>
 </details>
 </div>
 </main>
 </div>
}
