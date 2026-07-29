import Link from 'next/link';
import { MobileNav } from '@/components/mobile-nav';
import { createClient } from '@/lib/supabase/server';

const navigationGroups = [
  {
    label: 'Overview',
    links: [['Dashboard', '/dashboard']],
  },
  {
    label: 'Sales',
    links: [
      ['CRM / Add Lead', '/crm'],
      ['Sales Production', '/sales'],
      ['Canvassing', '/canvassing'],
    ],
  },
  {
    label: 'Projects',
    links: [
      ['Estimates', '/estimates'],
      ['Contracts & Proposals', '/proposals'],
      ['Production', '/production'],
    ],
  },
  {
    label: 'Business',
    links: [
      ['Marketing', '/marketing'],
      ['Accounting', '/accounting'],
    ],
  },
  {
    label: 'Development',
    links: [['Proper University', '/training']],
  },
  {
    label: 'System',
    links: [['Settings', '/settings']],
  },
];

export async function AppShell({children}:{children:React.ReactNode}){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user)await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">Proper OS</div>
      <div className="org"><small>Company</small><div>{orgs?.[0]?.organization_name||'Proper Remodeling'}</div></div>
      <nav className="nav" aria-label="Main navigation">
        {navigationGroups.map((group)=><div className="nav-group" key={group.label}>
          <div className="nav-group-label">{group.label}</div>
          {group.links.map(([name,href])=><Link key={href} href={href}>{name}</Link>)}
        </div>)}
      </nav>
    </aside>
    <main className="main">
      <header className="top app-header">
        <div><strong>Proper Remodeling</strong><div style={{color:'#6b7280'}}>{user?.email}</div></div>
        <div className="actions"><MobileNav/><button className="secondary notifications-button">Notifications</button></div>
      </header>
      {children}
    </main>
  </div>
}