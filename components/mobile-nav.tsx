'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links = [
  ['Dashboard', '/dashboard'],
  ['CRM', '/crm'],
  ['Estimates', '/estimates'],
  ['Proposals', '/proposals'],
  ['Production', '/production'],
  ['Canvassing', '/canvassing'],
  ['Marketing', '/marketing'],
  ['Human Resources', '/human-resources'],
  ['Accounting', '/accounting'],
  ['Settings', '/settings'],
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mobile-menu-button"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">☰</span>
        <span>Menu</span>
      </button>

      {open && (
        <div className="mobile-nav-layer">
          <button
            type="button"
            className="mobile-nav-backdrop"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="mobile-nav-drawer" aria-label="Main navigation">
            <div className="mobile-nav-header">
              <div>
                <strong>Proper OS</strong>
                <span>Proper Remodeling</span>
              </div>
              <button
                type="button"
                className="mobile-nav-close"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className="mobile-nav-links">
              {links.map(([name, href]) => (
                <Link
                  key={href}
                  href={href}
                  className={pathname === href ? 'active' : ''}
                  onClick={() => setOpen(false)}
                >
                  {name}
                  <span aria-hidden="true">›</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <nav className="mobile-tab-bar" aria-label="Quick navigation">
        <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>Home</Link>
        <Link href="/crm" className={pathname === '/crm' ? 'active' : ''}>Add Lead</Link>
        <Link href="/estimates" className={pathname === '/estimates' ? 'active' : ''}>Estimates</Link>
        <button type="button" onClick={() => setOpen(true)}>More</button>
      </nav>
    </>
  );
}
