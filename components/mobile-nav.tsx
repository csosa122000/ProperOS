'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type NavGroup={label:string;links:[string,string][]};

export function MobileNav({navigationGroups}:{navigationGroups:NavGroup[]}){
  const pathname=usePathname();const [open,setOpen]=useState(false);
  const quickLinks=navigationGroups.flatMap(group=>group.links);
  const has=(href:string)=>quickLinks.some(([,link])=>link===href);
  return <><button type="button" className="mobile-menu-button" aria-label="Open navigation" aria-expanded={open} onClick={()=>setOpen(true)}><span aria-hidden="true">☰</span><span>Menu</span></button>{open&&<div className="mobile-nav-layer"><button type="button" className="mobile-nav-backdrop" aria-label="Close navigation" onClick={()=>setOpen(false)}/><aside className="mobile-nav-drawer" aria-label="Main navigation"><div className="mobile-nav-header"><div><strong>Proper OS</strong><span>Proper Remodeling</span></div><button type="button" className="mobile-nav-close" aria-label="Close navigation" onClick={()=>setOpen(false)}>×</button></div><nav className="mobile-nav-links">{navigationGroups.map(group=><div key={group.label}><div className="nav-group-label">{group.label}</div>{group.links.map(([name,href])=><Link key={href} href={href} className={pathname===href?'active':''} onClick={()=>setOpen(false)}>{name}<span aria-hidden="true">›</span></Link>)}</div>)}</nav></aside></div>}<nav className="mobile-tab-bar" aria-label="Quick navigation"><Link href="/dashboard" className={pathname==='/dashboard'?'active':''}>Pulse</Link>{has('/marketing')?<Link href="/marketing" className={pathname==='/marketing'?'active':''}>Marketing</Link>:has('/sales')?<Link href="/sales" className={pathname==='/sales'?'active':''}>Sales</Link>:has('/production')?<Link href="/production" className={pathname==='/production'?'active':''}>Production</Link>:<Link href="/university" className={pathname==='/university'?'active':''}>University</Link>}{has('/estimates')?<Link href="/estimates" className={pathname==='/estimates'?'active':''}>Estimates</Link>:<Link href="/university" className={pathname==='/university'?'active':''}>University</Link>}<button type="button" onClick={()=>setOpen(true)}>More</button></nav></>;
}
