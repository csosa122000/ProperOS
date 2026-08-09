import Link from 'next/link';
import { NewLeadForm } from '@/components/new-lead-form';
import { createClient } from '@/lib/supabase/server';

const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));
const pct=(n:number)=>`${Math.round(Number(n||0))}%`;

type Leader={user_id:string;display_name:string;lifetime_volume:number;sale_count:number};
type Generator={workforce_member_id:string;display_name:string;credited_volume:number;sale_count:number;full_demo_count:number};
type Perf={issued_count:number;sit_count:number;full_demo_count:number;sale_count:number;sit_rate:number;full_demo_rate:number;close_rate:number;lifetime_volume:number;month_volume:number;ytd_volume:number;expected_commission:number};

export default async function Dashboard(){
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(user)await supabase.rpc('claim_pending_memberships');const {data:orgs}=await supabase.rpc('get_my_organizations');const org=orgs?.[0];
  let perf:Perf|undefined;let leaders:Leader[]=[];let canvassers:Generator[]=[];let telemarketers:Generator[]=[];let monthlyGoal=0;let annualGoal=0;let monthlyLeadCount=0;
  const now=new Date();const periodMonth=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  if(org){
    const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
    const [{data:performance},{data:leaderboard},{data:canvassing},{data:telemarketing},{data:goals},{count:leadCount}]=await Promise.all([
      supabase.rpc('get_sales_performance_metrics',{target_organization_id:org.organization_id,target_user_id:null}),
      supabase.rpc('get_lifetime_sales_leaderboard',{target_organization_id:org.organization_id}),
      supabase.rpc('get_lead_generator_leaderboard',{target_organization_id:org.organization_id,target_department:'canvassing',target_limit:3}),
      supabase.rpc('get_lead_generator_leaderboard',{target_organization_id:org.organization_id,target_department:'telemarketing',target_limit:3}),
      supabase.from('sales_goals').select('monthly_team_goal,annual_team_goal').eq('organization_id',org.organization_id).eq('period_month',periodMonth).maybeSingle(),
      supabase.from('leads').select('id',{count:'exact',head:true}).eq('organization_id',org.organization_id).gte('created_at',monthStart).is('deleted_at',null),
    ]);
    perf=(performance?.[0]||undefined) as Perf|undefined;leaders=((leaderboard||[]) as Leader[]).slice(0,3);canvassers=(canvassing||[]) as Generator[];telemarketers=(telemarketing||[]) as Generator[];monthlyGoal=Number(goals?.monthly_team_goal||0);annualGoal=Number(goals?.annual_team_goal||0);monthlyLeadCount=leadCount||0;
  }
  const daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();const startYear=new Date(now.getFullYear(),0,0);const dayOfYear=Math.floor((now.getTime()-startYear.getTime())/86400000);const daysInYear=new Date(now.getFullYear(),1,29).getMonth()===1?366:365;
  const monthlyPace=monthlyGoal>0?(Number(perf?.month_volume||0)/(monthlyGoal*now.getDate()/daysInMonth))*100:0;const annualPace=annualGoal>0?(Number(perf?.ytd_volume||0)/(annualGoal*dayOfYear/daysInYear))*100:0;
  const metrics=[['Annual sales to date',money(perf?.ytd_volume||0)],['Annual on-pace',pct(annualPace)],['Monthly sales volume',money(perf?.month_volume||0)],['Monthly on-pace',pct(monthlyPace)],['Total leads this month',String(monthlyLeadCount)],['Total sales this month',String(perf?.sale_count||0)]];
  return <><div className="top dashboard-heading"><div><h1>Company Pulse</h1><p>Live sales, lead flow, performance, and department rankings.</p></div>{user&&org&&<NewLeadForm organizationId={org.organization_id} branchId={org.default_branch_id} currentUserId={user.id}/>}</div><section className="grid">{metrics.map(([l,v])=><div className="card metric" key={l}><span>{l}</span><strong>{v}</strong></div>)}</section><section className="module-grid section"><div className="card"><h3>Sit Rate</h3><strong>{pct(perf?.sit_rate||0)}</strong><p>{perf?.sit_count||0} sits / {perf?.issued_count||0} issued this month</p></div><div className="card"><h3>Full Demo Rate</h3><strong>{pct(perf?.full_demo_rate||0)}</strong><p>{perf?.full_demo_count||0} full demos</p></div><div className="card"><h3>Close Rate</h3><strong>{pct(perf?.close_rate||0)}</strong><p>{perf?.sale_count||0} sales</p></div></section><section className="card section"><h2>Top 3 Sales Representatives — Lifetime</h2><table className="table"><thead><tr><th>Rank</th><th>Representative</th><th>Volume</th><th>Sales</th></tr></thead><tbody>{leaders.length?leaders.map((x,i)=><tr key={x.user_id}><td>#{i+1}</td><td>{x.display_name}</td><td>{money(x.lifetime_volume)}</td><td>{x.sale_count}</td></tr>):<tr><td colSpan={4}>No recorded sales yet.</td></tr>}</tbody></table></section><section className="module-grid section"><GeneratorCard title="Top Canvassers — This Month" rows={canvassers}/><GeneratorCard title="Top Telemarketers — This Month" rows={telemarketers}/><Link className="card module-link" href="/sales"><h3>Sales Workspace</h3><p>Individual scorecards, goals, commissions, and pipeline.</p><span>Open sales →</span></Link></section></>;
}

function GeneratorCard({title,rows}:{title:string;rows:Generator[]}){return <div className="card"><h3>{title}</h3>{rows.length?rows.map((x,i)=><p key={x.workforce_member_id}><strong>#{i+1} {x.display_name}</strong><br/>{money(x.credited_volume)} credited · {x.sale_count} sales · {x.full_demo_count} demos</p>):<p>No credited activity yet.</p>}</div>}
