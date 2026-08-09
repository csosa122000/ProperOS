import { createClient } from '@/lib/supabase/server';

const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);

type Leader={user_id:string;display_name:string;lifetime_volume:number;sale_count:number};
type PipelineCommission={lead_id:string;expected_commission_amount:number;commission_rate:number;commission_status:string;is_calculated:boolean;master_base_verified:boolean;job_funded:boolean};

type AllocationRow={volume_percent:number;contracts:{contract_price:number;signed_at:string|null;status:string}|null};

export default async function Sales(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user) await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];

  let lifetimeVolume=0,monthlyVolume=0,ytdVolume=0,expectedCommission=0;
  let leaders:Leader[]=[];
  let openPipeline=0;

  if(user&&org){
    const now=new Date();
    const yearStart=new Date(now.getFullYear(),0,1);
    const monthStart=new Date(now.getFullYear(),now.getMonth(),1);

    const [{data:leaderboard},{data:allocations},{data:pipelineCommissions},{data:assignedLeads}]=await Promise.all([
      supabase.rpc('get_lifetime_sales_leaderboard',{target_organization_id:org.organization_id}),
      supabase.from('sales_allocations').select('volume_percent,contracts!inner(contract_price,signed_at,status)').eq('organization_id',org.organization_id).eq('rep_user_id',user.id),
      supabase.rpc('get_sales_pipeline_commissions',{target_organization_id:org.organization_id}),
      supabase.from('leads').select('id').eq('organization_id',org.organization_id).eq('assigned_to',user.id).is('deleted_at',null),
    ]);

    leaders=(leaderboard||[]) as Leader[];
    lifetimeVolume=Number(leaders.find(rep=>rep.user_id===user.id)?.lifetime_volume||0);

    for(const row of (allocations||[]) as unknown as AllocationRow[]){
      const contract=row.contracts;
      if(!contract||contract.status!=='signed'||!contract.signed_at) continue;
      const percent=Number(row.volume_percent||0);
      const fraction=percent>1?percent/100:percent;
      const allocated=Number(contract.contract_price||0)*fraction;
      const signed=new Date(contract.signed_at);
      if(signed>=yearStart) ytdVolume+=allocated;
      if(signed>=monthStart) monthlyVolume+=allocated;
    }

    const leadIds=new Set((assignedLeads||[]).map(row=>row.id));
    const myPipeline=((pipelineCommissions||[]) as PipelineCommission[]).filter(row=>leadIds.has(row.lead_id));
    expectedCommission=myPipeline.reduce((sum,row)=>sum+Number(row.expected_commission_amount||0),0);
    openPipeline=myPipeline.filter(row=>!row.job_funded).length;
  }

  return <>
    <div><h1>Sales</h1><p>Your production, pipeline, commissions, and team performance in one workspace.</p></div>
    <section className="grid section">
      <div className="card metric"><span>Lifetime sales volume</span><strong>{money(lifetimeVolume)}</strong></div>
      <div className="card metric"><span>Sales this month</span><strong>{money(monthlyVolume)}</strong></div>
      <div className="card metric"><span>Year-to-date volume</span><strong>{money(ytdVolume)}</strong></div>
      <div className="card metric"><span>Expected commission</span><strong>{money(expectedCommission)}</strong></div>
    </section>

    <section className="module-grid section">
      <div className="card"><h3>Representative Scorecard</h3><p>Live volume is connected. Sit rate, close rate, full-demo rate, and goal pacing are the next scorecard metrics to connect.</p></div>
      <div className="card"><h3>Sales Pipeline</h3><strong>{openPipeline} open commission items</strong><p>Expected commission follows the current commission calculation records for leads assigned to you.</p></div>
      <div className="card"><h3>Commission Status</h3><p>Commission calculations remain subject to master-base verification, company-profit rules, funding status, and manager-approved splits.</p></div>
    </section>

    <section className="card section"><h2>Lifetime Sales Leaderboard</h2><table className="table"><thead><tr><th>Rank</th><th>Representative</th><th>Lifetime Volume</th><th>Sales</th></tr></thead><tbody>{leaders.length?leaders.map((rep,index)=><tr key={rep.user_id}><td>#{index+1}</td><td>{rep.display_name}</td><td>{money(Number(rep.lifetime_volume||0))}</td><td>{rep.sale_count}</td></tr>):<tr><td colSpan={4}>No recorded sales yet.</td></tr>}</tbody></table></section>
  </>;
}
