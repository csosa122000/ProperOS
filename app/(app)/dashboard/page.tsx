import Link from 'next/link';
import { NewLeadForm } from '@/components/new-lead-form';
import { createClient } from '@/lib/supabase/server';

const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);

export default async function Dashboard(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user) await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];

  let annualSales=0,monthlySales=0,monthlySaleCount=0,monthlyLeadCount=0;
  let leaders:{user_id:string;display_name:string;lifetime_volume:number;sale_count:number}[]=[];

  if(org){
    const now=new Date();
    const yearStart=new Date(now.getFullYear(),0,1).toISOString();
    const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString();

    const [{data:yearContracts},{data:monthContracts},{count:leadCount},{data:leaderboard}]=await Promise.all([
      supabase.from('contracts').select('contract_price').eq('organization_id',org.organization_id).eq('status','signed').gte('signed_at',yearStart),
      supabase.from('contracts').select('contract_price').eq('organization_id',org.organization_id).eq('status','signed').gte('signed_at',monthStart),
      supabase.from('leads').select('id',{count:'exact',head:true}).eq('organization_id',org.organization_id).gte('created_at',monthStart).is('deleted_at',null),
      supabase.rpc('get_lifetime_sales_leaderboard',{target_organization_id:org.organization_id}),
    ]);

    annualSales=(yearContracts||[]).reduce((sum,row)=>sum+Number(row.contract_price||0),0);
    monthlySales=(monthContracts||[]).reduce((sum,row)=>sum+Number(row.contract_price||0),0);
    monthlySaleCount=(monthContracts||[]).length;
    monthlyLeadCount=leadCount||0;
    leaders=((leaderboard||[]) as typeof leaders).slice(0,3);
  }

  const metrics=[
    ['Annual sales to date',money(annualSales)],
    ['Monthly sales volume',money(monthlySales)],
    ['Total leads this month',String(monthlyLeadCount)],
    ['Total sales this month',String(monthlySaleCount)],
  ];

  return <>
    <div className="top dashboard-heading">
      <div><h1>Company Pulse</h1><p>Live company performance, lead flow, sales activity, and operating visibility.</p></div>
      {user&&org&&<NewLeadForm organizationId={org.organization_id} branchId={org.default_branch_id} currentUserId={user.id}/>}
    </div>
    <section className="quick-actions" aria-label="Quick actions">
      <Link href="/crm">View leads</Link>
      <Link href="/sales">Sales</Link>
      <Link href="/marketing">Marketing</Link>
      <Link href="/production">Production</Link>
    </section>
    <section className="grid">{metrics.map(([l,v])=><div className="card metric" key={l}><span>{l}</span><strong>{v}</strong></div>)}</section>

    <section className="card section">
      <div className="section-heading"><div><h2>Lifetime Sales Leaderboard</h2><p>Top representatives ranked by recorded lifetime sold volume.</p></div></div>
      <table className="table"><thead><tr><th>Rank</th><th>Representative</th><th>Lifetime Volume</th><th>Sales</th></tr></thead><tbody>{leaders.length?leaders.map((rep,index)=><tr key={rep.user_id}><td>#{index+1}</td><td>{rep.display_name}</td><td>{money(Number(rep.lifetime_volume||0))}</td><td>{rep.sale_count}</td></tr>):<tr><td colSpan={4}>No recorded sales yet.</td></tr>}</tbody></table>
    </section>

    <section className="card section"><h2>Company Posts</h2><p>Company-wide announcements will appear here for every employee and contractor.</p></section>

    <section className="module-grid section">
      <Link className="card module-link" href="/sales"><h3>Sales</h3><p>Lifetime volume, monthly/YTD production, pipeline, and commission visibility.</p><span>Open sales →</span></Link>
      <Link className="card module-link" href="/production"><h3>Production</h3><p>Scheduling, remeasures, materials, crews, quality, service, and completion.</p><span>Open production →</span></Link>
      <Link className="card module-link" href="/proposals"><h3>Documents</h3><p>Estimates, proposals, accepted projects, and contracts.</p><span>Open documents →</span></Link>
    </section>
  </>;
}
