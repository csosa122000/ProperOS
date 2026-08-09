import Link from 'next/link';
import { MobileNav } from '@/components/mobile-nav';
import { createClient } from '@/lib/supabase/server';

type NavGroup={label:string;links:[string,string][]};

const fullNavigation:NavGroup[]=[
  {label:'Overview',links:[['Company Pulse','/dashboard']]},
  {label:'Operations',links:[['Sales','/sales'],['Production','/production'],['Canvassing','/canvassing']]},
  {label:'Documents',links:[['Estimates','/estimates'],['Proposals','/proposals'],['Contracts','/contracts']]},
  {label:'Business',links:[['Marketing','/marketing'],['Accounting','/accounting'],['Human Resources','/human-resources']]},
  {label:'Development',links:[['Proper University','/university']]},
  {label:'System',links:[['Settings','/settings']]},
];

function navigationForRoles(roles:string[]=[]):NavGroup[]{
  const roleSet=new Set(roles);
  if(['company_owner','company_admin','company_manager'].some(role=>roleSet.has(role))) return fullNavigation;
  const links:[string,string][]=[];
  if(roleSet.has('sales_rep')) links.push(['Sales','/sales'],['Estimates','/estimates'],['Proposals','/proposals'],['Contracts','/contracts']);
  if(roleSet.has('production')) links.push(['Production','/production']);
  if(roleSet.has('canvassing')) links.push(['Canvassing','/canvassing']);
  if(roleSet.has('marketing')) links.push(['Marketing','/marketing']);
  if(roleSet.has('call_center')) links.push(['Marketing','/marketing']);
  if(roleSet.has('accounting')) links.push(['Accounting','/accounting']);
  if(roleSet.has('read_only')&&links.length===0) links.push(['Proper University','/university']);
  if(links.length&&!links.some(([,href])=>href==='/university')) links.push(['Proper University','/university']);
  return [{label:'Overview',links:[['Company Pulse','/dashboard']]},...(links.length?[{label:'Workspace',links}]:[])];
}

export async function AppShell({children}:{children:React.ReactNode}){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user) await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const membership=orgs?.[0];
  const navigationGroups=navigationForRoles((membership?.roles||[]) as string[]);
  return <div className="shell"><aside className="sidebar"><div className="brand">Proper OS</div><div className="org"><small>Company</small><div>{membership?.organization_name||'Proper Remodeling'}</div></div><nav className="nav" aria-label="Main navigation">{navigationGroups.map(group=><div className="nav-group" key={group.label}><div className="nav-group-label">{group.label}</div>{group.links.map(([name,href])=><Link key={href} href={href}>{name}</Link>)}</div>)}</nav></aside><main className="main"><header className="top app-header"><div><strong>Proper Remodeling</strong><div style={{color:'#6b7280'}}>{user?.email}</div></div><div className="actions"><MobileNav navigationGroups={navigationGroups}/><button className="secondary notifications-button">Notifications</button></div></header>{children}</main></div>;
}
