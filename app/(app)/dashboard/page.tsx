import Link from 'next/link';
import { NewLeadForm } from '@/components/new-lead-form';
import { createClient } from '@/lib/supabase/server';

const metrics=[['Sales this month','$0'],['Open pipeline','$0'],['Appointments','0'],['Active jobs','0']];

export default async function Dashboard(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user)await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];

  return <>
    <div className="top dashboard-heading">
      <div><h1>Executive Dashboard</h1><p>Company performance and operating pulse.</p></div>
      {user&&org&&<NewLeadForm organizationId={org.organization_id} branchId={org.default_branch_id} currentUserId={user.id}/>}
    </div>
    <section className="quick-actions" aria-label="Quick actions">
      <Link href="/crm">View leads</Link>
      <Link href="/canvassing">Canvassing</Link>
      <Link href="/marketing">Marketing</Link>
      <Link href="/accounting">Accounting</Link>
    </section>
    <section className="grid">{metrics.map(([l,v])=><div className="card metric" key={l}><span>{l}</span><strong>{v}</strong></div>)}</section>
    <section className="card section"><h2>Today</h2><table className="table"><thead><tr><th>Time</th><th>Customer</th><th>Project</th><th>Status</th></tr></thead><tbody><tr><td colSpan={4}>No appointments scheduled.</td></tr></tbody></table></section>
    <section className="module-grid section">
      <Link className="card module-link" href="/crm"><h3>Sales Pipeline</h3><p>Lead intake, appointments, and close tracking.</p><span>Open CRM →</span></Link>
      <Link className="card module-link" href="/production"><h3>Production</h3><p>Remeasures, materials, crews, and completion.</p><span>Open production →</span></Link>
      <Link className="card module-link" href="/proposals"><h3>Proposal Center</h3><p>Branded proposals using Proper pricing rules.</p><span>Open proposals →</span></Link>
    </section>
  </>
}
