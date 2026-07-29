'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type NavigationGroup = { label: string; links: string[][] };

export function MobileNav({ navigationGroups }: { navigationGroups: NavigationGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const quickLinks = navigationGroups.flatMap(group => group.links).filter(([, href]) => href !== '/dashboard').slice(0, 2);

  return (
    <>
      <button type="button" className="mobile-menu-button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
        <span aria-hidden="true">☰</span><span>Menu</span>
      </button>

      {open && (
        <div className="mobile-nav-layer">
          <button type="button" className="mobile-nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside className="mobile-nav-drawer" aria-label="Main navigation">
            <div className="mobile-nav-header">
              <div><strong>Proper OS</strong><span>Proper Remodeling</span></div>
              <button type="button" className="mobile-nav-close" aria-label="Close navigation" onClick={() => setOpen(false)}>×</button>
            </div>
            <nav className="mobile-nav-links">
              {navigationGroups.map(group => (
                <div className="mobile-nav-group" key={group.label}>
                  <div className="mobile-nav-group-label">{group.label}</div>
                  {group.links.map(([name, href]) => (
                    <Link key={href} href={href} className={pathname === href ? 'active' : ''} onClick={() => setOpen(false)}>
                      {name}<span aria-hidden="true">›</span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <nav className="mobile-tab-bar" aria-label="Quick navigation">
        <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>Company Pulse</Link>
        {quickLinks.map(([name, href]) => <Link key={href} href={href} className={pathname === href ? 'active' : ''}>{name}</Link>)}
        <button type="button" onClick={() => setOpen(true)}>More</button>
      </nav>
    </>
  );
}
