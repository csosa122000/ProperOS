import { createClient } from '@/lib/supabase/server';
import { AccountingFundingAction } from '@/components/accounting-funding-action';

const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));
const dateTime=(value:string|null)=>value?new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value)):'—';
type Summary={accounts_receivable:number;collected_this_month:number;outstanding_commissions:number;gross_profit:number;funded_sales:number};
type Job={id:string;contract_number:string;customer_name:string;sold_price:number;required_down_payment:number;funded_at:string|null;rescission_clears_at:string|null;status:string;funding_status:string};
type FundingStage='pending_rescission'|'pre_funding'|'funded'|'closed';

function fundingStage(job:Job):FundingStage{
  if(job.status==='closed')return 'closed';
  if(job.funded_at)return 'funded';
  if(job.rescission_clears_at&&Date.now()>=new Date(job.rescission_clears_at).getTime())return 'pre_funding';
  return 'pending_rescission';
}
function stageLabel(stage:FundingStage){return stage==='pending_rescission'?'Rescission Period':stage==='pre_funding'?'Pre-Funding':stage==='funded'?'Funded':'Closed';}

export default async function Accounting(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user)await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];
  let summary:Summary|undefined;let activeJobs:Job[]=[];
  if(org){
    const [{data:s},{data:jobs}]=await Promise.all([
      supabase.rpc('get_accounting_summary',{target_organization_id:org.organization_id}),
      supabase.from('accounting_jobs').select('id,contract_number,customer_name,sold_price,required_down_payment,funded_at,rescission_clears_at,status,funding_status').eq('organization_id',org.organization_id).neq('status','void').order('signed_at',{ascending:false}).limit(20)
    ]);
    summary=(s?.[0]||undefined) as Summary|undefined;
    activeJobs=(jobs||[]) as Job[];
  }
  const canManageFunding=Boolean(org?.permissions?.includes('accounting.finance.manage'));
  const counts=activeJobs.reduce((acc,job)=>{acc[fundingStage(job)]++;return acc;},{pending_rescission:0,pre_funding:0,funded:0,closed:0} as Record<FundingStage,number>);

  return <>
    <div><h1>Accounting</h1><p>Contract Signed → Rescission Period → Pre-Funding → Funded → Closed. Funded means the customer deposit/payment has actually posted to Proper Remodeling’s bank account.</p></div>
    <section className="grid section">
      <div className="card metric"><span>Accounts receivable</span><strong>{money(summary?.accounts_receivable||0)}</strong></div>
      <div className="card metric"><span>Collected this month</span><strong>{money(summary?.collected_this_month||0)}</strong></div>
      <div className="card metric"><span>Outstanding commissions</span><strong>{money(summary?.outstanding_commissions||0)}</strong></div>
      <div className="card metric"><span>Funded sales</span><strong>{money(summary?.funded_sales||0)}</strong></div>
    </section>
    <section className="module-grid section">
      <div className="card"><h3>Rescission Period</h3><strong>{counts.pending_rescission}</strong><p>Signed contracts still inside the three-day rescission window.</p></div>
      <div className="card"><h3>Pre-Funding</h3><strong>{counts.pre_funding}</strong><p>Rescission cleared; waiting for the deposit/payment to post to Proper’s bank account.</p></div>
      <div className="card"><h3>Funded</h3><strong>{counts.funded}</strong><p>Accounting confirmed money received. Sales volume can now be credited.</p></div>
      <div className="card"><h3>Closed</h3><strong>{counts.closed}</strong><p>Final accounting and job closeout completed.</p></div>
    </section>
    <section className="card section">
      <h2>Funding Queue</h2>
      <p>Only Accounting/Admin can mark a job Funded, and the action remains locked until the rescission period clears.</p>
      <table className="table"><thead><tr><th>Contract</th><th>Customer</th><th>Sold Price</th><th>Deposit</th><th>Status</th><th>Rescission Clears</th><th>Accounting Action</th></tr></thead><tbody>
        {activeJobs.length?activeJobs.map(job=>{const stage=fundingStage(job);const eligible=canManageFunding&&stage==='pre_funding';return <tr key={job.id}><td>{job.contract_number}</td><td>{job.customer_name}</td><td>{money(job.sold_price)}</td><td>{money(job.required_down_payment)}</td><td><span className="pill">{stageLabel(stage)}</span></td><td>{dateTime(job.rescission_clears_at)}</td><td>{stage==='pre_funding'?<AccountingFundingAction jobId={job.id} eligible={eligible}/>:stage==='funded'?`Received ${dateTime(job.funded_at)}`:stage==='closed'?'Closed':'Locked until rescission clears'}</td></tr>}):<tr><td colSpan={7}>No accounting jobs yet.</td></tr>}
      </tbody></table>
    </section>
    <section className="module-grid section"><div className="card"><h3>Customer payments</h3><p>Deposits, progress payments, final payments, finance funding, and refunds roll into receivables automatically.</p></div><div className="card"><h3>Sales commissions</h3><p>Signed sales can show expected commission immediately, but credited volume remains locked until Accounting confirms funding.</p></div><div className="card"><h3>Job costs</h3><p>Gross profit uses committed and paid job costs against sold revenue.</p></div></section>
  </>;
}
