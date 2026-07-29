import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const companyMetrics = [
  ['Annual sales to date', '$0'],
  ['Annual volume on pace', '$0'],
  ['Annual pace percentage', '0%'],
  ['Total leads this month', '0'],
  ['Total sales this month', '$0'],
];

const departmentHome: Record<string, { title: string; description: string; links: [string, string, string][] }> = {
  sales: { title: 'Sales Home', description: 'Your leads, appointments, estimates, contracts, and sales pace.', links: [['Open CRM', '/crm', 'Manage leads and appointments.'], ['Build Estimate', '/estimates', 'Create a condensed customer estimate.'], ['Sales Production', '/sales', 'Review individual sales results and pace.']] },
  canvassing: { title: 'Canvassing Home', description: 'Your doors, contacts, appointments, and team activity.', links: [['Canvassing', '/canvassing', 'Track doors, contacts, and appointments.'], ['Add Lead', '/crm', 'Send a qualified lead into the CRM.'], ['Training', '/training', 'Open canvassing scripts and modules.']] },
  production: { title: 'Production Home', description: 'Remeasures, materials, installers, start dates, and completion.', links: [['Production Board', '/production', 'Manage active jobs and required next steps.'], ['Contracts', '/proposals', 'Review approved customer documents.'], ['Training', '/training', 'Open production and installation training.']] },
  marketing: { title: 'Marketing Home', description: 'Campaigns, lead sources, creative requests, and performance.', links: [['Marketing', '/marketing', 'Manage campaigns and lead sources.'], ['Training', '/training', 'Open marketing standards and resources.']] },
  accounting: { title: 'Accounting Home', description: 'Payments, balances, job costing, and accounting tasks.', links: [['Accounting', '/accounting', 'Review company accounting workflows.'], ['Contracts', '/proposals', 'Review signed documents and payment terms.']] },
};

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.rpc('claim_pending_memberships');

  const role = String(user?.app_metadata?.role || user?.user_metadata?.role || 'team_member');
  const department = String(user?.app_metadata?.department || user?.user_metadata?.department || '').toLowerCase();
  const canViewCompanyMetrics = ['super_user', 'administrator', 'manager'].includes(role);
  const home = departmentHome[department];

  return <>
    <div className="top dashboard-heading">
      <div>
        <h1>{canViewCompanyMetrics ? 'Company Pulse' : home?.title || 'Company Home'}</h1>
        <p>{canViewCompanyMetrics ? 'Annual performance, monthly activity, and company-wide production at a glance.' : home?.description || 'Company posts, announcements, and your assigned workspace.'}</p>
      </div>
    </div>

    <section className="card section">
      <h2>Company Posts</h2>
      <p>Announcements, recognition, schedule updates, training notices, and company-wide communication will appear here for every team member.</p>
    </section>

    {canViewCompanyMetrics ? <>
      <section className="grid">{companyMetrics.map(([label, value]) => <div className="card metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
      <section className="card section">
        <h2>Top Three Representatives</h2>
        <table className="table"><thead><tr><th>Rank</th><th>Representative</th><th>Monthly Sales</th><th>Annual Sales</th></tr></thead><tbody>
          <tr><td>1</td><td>No sales data yet</td><td>$0</td><td>$0</td></tr>
          <tr><td>2</td><td>No sales data yet</td><td>$0</td><td>$0</td></tr>
          <tr><td>3</td><td>No sales data yet</td><td>$0</td><td>$0</td></tr>
        </tbody></table>
      </section>
      <section className="module-grid section">
        <Link className="card module-link" href="/people"><h3>Employees & Contractors</h3><p>Add personnel, assign departments, and control access.</p><span>Manage people →</span></Link>
        <Link className="card module-link" href="/sales"><h3>Sales</h3><p>Review company sales production and representative pace.</p><span>Open sales →</span></Link>
        <Link className="card module-link" href="/production"><h3>Production</h3><p>Review active jobs, milestones, crews, and completion.</p><span>Open production →</span></Link>
      </section>
    </> : <section className="module-grid section">
      {(home?.links || [['Proper University', '/training', 'Open assigned training and company resources.']]).map(([name, href, description]) => <Link className="card module-link" href={href} key={href}><h3>{name}</h3><p>{description}</p><span>Open →</span></Link>)}
    </section>}
  </>;
}