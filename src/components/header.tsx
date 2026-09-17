import Image from 'next/image';
import Link from 'next/link';
export function Header({ children }: { children?: React.ReactNode }) {
  return <header className="site-header"><div className="header-inner"><Link href="/" className="brand"><Image src="/brand/plane-ink.png" alt="" width={43} height={43}/><span>纸飞机<small>PAPERPLANE</small></span></Link>{children}</div></header>;
}
