import Link from 'next/link';
import { MobileNav } from '@/components/mobile-nav';
import { createClient } from '@/lib/supabase/server';

type NavLink = [string, string];
type NavGroup = { label: string; links: NavLink[] };

const fullNavigation: NavGroup[] = [
  { label: 'Overview', links: [['Company Pulse', '/dashboard']] },
  {
    label: 'Operations',
    links: [
      ['Sales', '/sales'],
      ['Production', '/production'],
      ['Canvassing', '/canvassing'],
      ['CRM / Add Lead', '/crm'],
    ],
  },
  { label: 'Documents', links: [['Estimates', '/estimates'], ['Contracts & Proposals', '/proposals']] },
  { label: 'Business', links: [['Marketing', '/marketing'], ['Accounting', '/accounting']] },
  { label: 'People', links: [['Employees & Contractors', '/people']] },
  { label: 'Development', links: [['Proper University', '/training']] },
  { label: 'System', links: [['Settings', '/settings']] },
];

const departmentLinks: Record<string, NavLink[]> = {
  sales: [['Sales Home', '/sales'], ['CRM / Add Lead', '/crm'], ['Estimates', '/estimates'], ['Contracts & Proposals', '/proposals'], ['Proper University', '/training']],
  canvassing: [['Canvassing Home', '/canvassing'], ['CRM / Add Lead', '/crm'], ['Proper University', '/training']],
  production: [['Production Home', '/production'], ['Contracts & Proposals', '/proposals'], ['Proper University', '/training']],
  marketing: [['Marketing Home', '/marketing'], ['Proper University', '/training']],
  accounting: [['Accounting Home', '/accounting'], ['Contracts & Proposals', '/proposals'], ['Proper University', '/training']],
};

function getNavigation(role?: string, department?: string): NavGroup[] {
  if (['super_user', 'administrator', 'manager'].includes(role || '')) return fullNavigation;
  const links = departmentLinks[(department || '').toLowerCase()] || [['Proper University', '/training']];
  return [
    { label: 'Overview', links: [['Company Pulse', '/dashboard']] },
    { label: 'My Workspace', links },
  ];
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.rpc('claim_pending_memberships');
  const { data: orgs } = await supabase.rpc('get_my_organizations');

  const role = String(user?.app_metadata?.role || user?.user_metadata?.role || 'team_member');
  const department = String(user?.app_metadata?.department || user?.user_metadata?.department || '');
  const navigationGroups = getNavigation(role, department);

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">Proper OS</div>
      <div className="org"><small>Company</small><div>{orgs?.[0]?.organization_name || 'Proper Remodeling'}</div></div>
      <nav className="nav" aria-label="Main navigation">
        {navigationGroups.map((group) => <div className="nav-group" key={group.label}>
          <div className="nav-group-label">{group.label}</div>
          {group.links.map(([name, href]) => <Link key={href} href={href}>{name}</Link>)}
        </div>)}
      </nav>
    </aside>
    <main className="main">
      <header className="top app-header">
        <div><strong>Proper Remodeling</strong><div style={{ color: '#6b7280' }}>{department ? `${department} · ` : ''}{user?.email}</div></div>
        <div className="actions"><MobileNav navigationGroups={navigationGroups}/><button className="secondary notifications-button">Notifications</button></div>
      </header>
      {children}
    </main>
  </div>;
}