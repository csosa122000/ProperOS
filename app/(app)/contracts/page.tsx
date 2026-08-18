import { ContractBuilder } from '@/components/contract-builder';
import { ContractActions } from '@/components/contract-actions';
import { createClient } from '@/lib/supabase/server';

type SalesRep={workforce_member_id:string;linked_user_id:string|null;display_name:string;job_title:string|null;branch_id:string|null;sales_activation_status:string};

export default async function Contracts(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user)await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];
  if(!user||!org)return <div className="card"><h1>Contracts & Signatures</h1><p>Your workspace must be active.</p></div>;

  const [{data:contractRows},{data:roster}]=await Promise.all([
    supabase.from('contracts').select('id,estimate_id,contract_number,customer_name,co_homeowner_name,representative_name,co_representative_name,contract_price,payment_terms,status,cancellation_notice_acknowledged,general_terms,created_at').eq('organization_id',org.organization_id).order('created_at',{ascending:false}),
    supabase.rpc('get_active_sales_roster',{target_organization_id:org.organization_id})
  ]);
  const activeContractEstimateIds=new Set((contractRows||[]).filter((c:any)=>c.status!=='void').map((c:any)=>c.estimate_id).filter(Boolean));
  const {data:proposalRows}=await supabase.from('customer_proposals').select('id,estimate_id,proposal_number,title,accepted_by_name').eq('organization_id',org.organization_id).eq('status','accepted').order('accepted_at',{ascending:false});
  const eligibleProposalRows=(proposalRows||[]).filter((p:any)=>!activeContractEstimateIds.has(p.estimate_id));
  const estimateIds=eligibleProposalRows.map((p:any)=>p.estimate_id);
  const {data:estimateRows}=estimateIds.length?await supabase.from('estimates').select('id,project_name,project_address,ninety_day_price,today_price').in('id',estimateIds):{data:[]};
  const estimateMap=new Map((estimateRows||[]).map((e:any)=>[e.id,{...e,ninety_day_price:Number(e.ninety_day_price),today_price:Number(e.today_price)}]));
  const proposals=eligibleProposalRows.map((p:any)=>({...p,estimate:estimateMap.get(p.estimate_id)})).filter((p:any)=>p.estimate);
  const salesReps=((roster||[]) as SalesRep[]).map(rep=>({workforceMemberId:rep.workforce_member_id,linkedUserId:rep.linked_user_id,name:rep.display_name,jobTitle:rep.job_title,branchId:rep.branch_id,activationStatus:rep.sales_activation_status}));
  const money=(n:any)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));

  return <>
    <div className="top"><div><h1>Contracts & Signatures</h1><p>Create contracts from accepted proposals, review payment promotions, and complete the in-home electronic signing workflow.</p></div></div>
    <ContractBuilder organizationId={org.organization_id} userId={user.id} proposals={proposals as any} salesReps={salesReps}/>
    <div className="card section"><h2>Contracts</h2><table className="table"><thead><tr><th>Contract</th><th>Customer</th><th>Price</th><th>Payment terms</th><th>Status / Signature</th></tr></thead><tbody>{contractRows?.length?contractRows.map((c:any)=><tr key={c.id}><td>{c.contract_number}</td><td>{c.customer_name}</td><td>{money(c.contract_price)}</td><td>{c.payment_terms}</td><td><ContractActions contract={c} userId={user.id}/></td></tr>):<tr><td colSpan={5}>No contracts created yet.</td></tr>}</tbody></table></div>
  </>;
}
