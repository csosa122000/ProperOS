import Link from 'next/link';
import { MobileNav } from '@/components/mobile-nav';
import { createClient } from '@/lib/supabase/server';

const fullNavigation = [
  { label: 'Overview', links: [['Company Pulse', '/dashboard']] },
  { label: 'Operations', links: [['Sales', '/sales'], ['Production', '/production'], ['Canvassing', '/canvassing']] },
  { label: 'Documents', links: [['Estimates', '/estimates'], ['Contracts & Proposals', '/proposals']] },
  { label: 'Business', links: [['Marketing', '/marketing'], ['Accounting', '/accounting'], ['Human Resources', '/human-resources']] },
  { label: 'Development', links: [['Proper University', '/training']] },
  { label: 'System', links: [['Employees & Contractors', '/team'], ['Settings', '/settings']] },
];

const departmentLinks: Record<string, [string, string][]> = {
  sales: [['Sales', '/sales'], ['Estimates', '/estimates'], ['Contracts & Proposals', '/proposals'], ['Proper University', '/training']],
  canvassing: [['Canvassing', '/canvassing'], ['Proper University', '/training']],
  production: [['Production', '/production'], ['Proper University', '/training']],
  marketing: [['Marketing', '/marketing'], ['Proper University', '/training']],
  accounting: [['Accounting', '/accounting'], ['Human Resources', '/human-resources'], ['Proper University', '/training']],
  administration: [['Human Resources', '/human-resources'], ['Employees & Contractors', '/team'], ['Settings', '/settings']],
};

function getNavigation(role?: string, department?: string) {
  const normalizedRole = role?.toLowerCase().replaceAll(' ', '_');
  const canSeeFullMenu = ['super_user', 'administrator', 'manager'].includes(normalizedRole || '');
  if (canSeeFullMenu) return fullNavigation;
  const links = departmentLinks[(department || '').toLowerCase()] || [];
  return [
    { label: 'Overview', links: [['Company Pulse', '/dashboard']] },
    ...(links.length ? [{ label: 'Workspace', links }] : []),
  ];
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.rpc('claim_pending_memberships');
  const { data: orgs } = await supabase.rpc('get_my_organizations');
  const membership = orgs?.[0];
  const navigationGroups = getNavigation(membership?.role, membership?.department);

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">Proper OS</div>
      <div className="org"><small>Company</small><div>{membership?.organization_name || 'Proper Remodeling'}</div></div>
      <nav className="nav" aria-label="Main navigation">
        {navigationGroups.map(group => <div className="nav-group" key={group.label}>
          <div className="nav-group-label">{group.label}</div>
          {group.links.map(([name, href]) => <Link key={href} href={href}>{name}</Link>)}
        </div>)}
      </nav>
    </aside>
    <main className="main">
      <header className="top app-header">
        <div><strong>Proper Remodeling</strong><div style={{ color: '#6b7280' }}>{user?.email}</div></div>
        <div className="actions"><MobileNav navigationGroups={navigationGroups}/><button className="secondary notifications-button">Notifications</button></div>
      </header>
      {children}
    </main>
  </div>;
}
