import { createClient } from '@/lib/supabase/server';
import { SalesGoalManager } from '@/components/sales-goal-manager';

const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));
const pct=(n:number)=>`${Math.round(Number(n||0))}%`;
const dateTime=(value:string|null)=>value?new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value)):'—';
type Perf={issued_count:number;sit_count:number;full_demo_count:number;sale_count:number;sit_rate:number;full_demo_rate:number;close_rate:number;lifetime_volume:number;month_volume:number;ytd_volume:number;expected_commission:number};
type Leader={user_id:string|null;display_name:string;lifetime_volume:number;sale_count:number};
type PendingSale={accounting_job_id:string;contract_number:string;customer_name:string;sold_price:number;credited_volume:number;signed_at:string;rescission_clears_at:string|null;funding_stage:'pending_rescission'|'pre_funding'|'funded'|'closed';expected_commission:number};
const stageLabel=(stage:PendingSale['funding_stage'])=>stage==='pending_rescission'?'Rescission Period':stage==='pre_funding'?'Pre-Funding':stage==='funded'?'Funded':'Closed';

export default async function Sales(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user)await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];
  let perf:Perf|undefined;let leaders:Leader[]=[];let pendingSales:PendingSale[]=[];let monthlyGoal=0;let annualGoal=0;
  const now=new Date();const periodMonth=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  if(user&&org){
    const [{data:performance},{data:leaderboard},{data:pending},{data:goals}]=await Promise.all([
      supabase.rpc('get_sales_performance_metrics',{target_organization_id:org.organization_id,target_user_id:user.id}),
      supabase.rpc('get_lifetime_sales_leaderboard',{target_organization_id:org.organization_id}),
      supabase.rpc('get_sales_pending_sales',{target_organization_id:org.organization_id}),
      supabase.from('sales_goals').select('monthly_team_goal,annual_team_goal').eq('organization_id',org.organization_id).eq('period_month',periodMonth).maybeSingle()
    ]);
    perf=(performance?.[0]||undefined) as Perf|undefined;
    leaders=(leaderboard||[]) as Leader[];
    pendingSales=(pending||[]) as PendingSale[];
    monthlyGoal=Number(goals?.monthly_team_goal||0);annualGoal=Number(goals?.annual_team_goal||0);
  }
  const pendingVolume=pendingSales.reduce((sum,sale)=>sum+Number(sale.credited_volume||0),0);
  const pendingCommission=pendingSales.reduce((sum,sale)=>sum+Number(sale.expected_commission||0),0);
  const daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const monthlyPace=monthlyGoal>0?(Number(perf?.month_volume||0)/(monthlyGoal*now.getDate()/daysInMonth))*100:0;
  const canManageGoals=Boolean(org?.permissions?.includes('accounting.finance.manage'));

  return <>
    <div><h1>Sales</h1><p>Signed sales appear immediately as Pending. Lifetime, monthly and YTD volume are credited only after Accounting confirms the customer’s deposit/payment has posted to Proper Remodeling’s bank account.</p></div>
    <section className="grid section">
      <div className="card metric"><span>Credited lifetime volume</span><strong>{money(perf?.lifetime_volume||0)}</strong></div>
      <div className="card metric"><span>Credited this month</span><strong>{money(perf?.month_volume||0)}</strong></div>
      <div className="card metric"><span>Credited YTD volume</span><strong>{money(perf?.ytd_volume||0)}</strong></div>
      <div className="card metric"><span>Pending signed volume</span><strong>{money(pendingVolume)}</strong></div>
      <div className="card metric"><span>Expected commission</span><strong>{money(perf?.expected_commission||pendingCommission)}</strong></div>
    </section>
    <section className="card section">
      <h2>Pending Sales</h2>
      <p>These contracts are signed and in the commission pipeline, but their volume has not been credited yet.</p>
      <table className="table"><thead><tr><th>Contract</th><th>Customer</th><th>Your Volume</th><th>Expected Commission</th><th>Status</th><th>Rescission Clears</th></tr></thead><tbody>
        {pendingSales.length?pendingSales.map(sale=><tr key={sale.accounting_job_id}><td>{sale.contract_number}</td><td>{sale.customer_name}</td><td>{money(sale.credited_volume)}</td><td>{money(sale.expected_commission)}</td><td><span className="pill">{stageLabel(sale.funding_stage)}</span></td><td>{dateTime(sale.rescission_clears_at)}</td></tr>):<tr><td colSpan={6}>No pending signed sales.</td></tr>}
      </tbody></table>
    </section>
    <section className="module-grid section">
      <div className="card"><h3>Sit Rate</h3><strong>{pct(perf?.sit_rate||0)}</strong><p>{perf?.sit_count||0} sits from {perf?.issued_count||0} issued.</p></div>
      <div className="card"><h3>Full Demo Rate</h3><strong>{pct(perf?.full_demo_rate||0)}</strong><p>{perf?.full_demo_count||0} full demos this month.</p></div>
      <div className="card"><h3>Close Rate</h3><strong>{pct(perf?.close_rate||0)}</strong><p>{perf?.sale_count||0} signed sales this month.</p></div>
      <div className="card"><h3>Monthly Team Goal</h3><strong>{money(monthlyGoal)}</strong><p>Credited-volume pace: {pct(monthlyPace)}</p></div>
    </section>
    <section className="card section"><h2>Lifetime Sales Leaderboard</h2><p>The leaderboard uses funded/credited sales only.</p><table className="table"><thead><tr><th>Rank</th><th>Representative</th><th>Credited Lifetime Volume</th><th>Credited Sales</th></tr></thead><tbody>{leaders.length?leaders.map((rep,index)=><tr key={`${rep.user_id||rep.display_name}-${index}`}><td>#{index+1}</td><td>{rep.display_name}</td><td>{money(rep.lifetime_volume)}</td><td>{rep.sale_count}</td></tr>):<tr><td colSpan={4}>No credited sales yet.</td></tr>}</tbody></table></section>
    {user&&org&&canManageGoals&&<SalesGoalManager organizationId={org.organization_id} periodMonth={periodMonth} monthlyGoal={monthlyGoal} annualGoal={annualGoal} userId={user.id}/>}  
  </>;
}
