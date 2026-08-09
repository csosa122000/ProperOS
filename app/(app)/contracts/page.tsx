import { ContractBuilder } from '@/components/contract-builder';
import { createClient } from '@/lib/supabase/server';

export default async function Contracts(){
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(user)await supabase.rpc('claim_pending_memberships');const {data:orgs}=await supabase.rpc('get_my_organizations');const org=orgs?.[0];
  if(!user||!org)return <div className="card"><h1>Contracts & Signatures</h1><p>Your workspace must be active.</p></div>;
  const {data:proposalRows}=await supabase.from('customer_proposals').select('id,estimate_id,proposal_number,title,accepted_by_name').eq('organization_id',org.organization_id).eq('status','accepted').order('accepted_at',{ascending:false});
  const estimateIds=(proposalRows||[]).map((p:any)=>p.estimate_id);const {data:estimateRows}=estimateIds.length?await supabase.from('estimates').select('id,project_name,project_address,ninety_day_price,today_price').in('id',estimateIds):{data:[]};
  const estimateMap=new Map((estimateRows||[]).map((e:any)=>[e.id,{...e,ninety_day_price:Number(e.ninety_day_price),today_price:Number(e.today_price)}]));
  const proposals=(proposalRows||[]).map((p:any)=>({...p,estimate:estimateMap.get(p.estimate_id)})).filter((p:any)=>p.estimate);
  const {data:contracts}=await supabase.from('contracts').select('id,contract_number,customer_name,contract_price,payment_terms,status,created_at').eq('organization_id',org.organization_id).order('created_at',{ascending:false});
  const money=(n:any)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));
  return <><div className="top"><div><h1>Contracts & Signatures</h1><p>Create contracts only from accepted proposals, manage payment promotions, two homeowners/two representatives, rescission acknowledgement, and signing workflow.</p></div></div><ContractBuilder organizationId={org.organization_id} userId={user.id} proposals={proposals as any}/><div className="card section"><h2>Contracts</h2><table className="table"><thead><tr><th>Contract</th><th>Customer</th><th>Price</th><th>Payment terms</th><th>Status</th></tr></thead><tbody>{contracts?.length?contracts.map((c:any)=><tr key={c.id}><td>{c.contract_number}</td><td>{c.customer_name}</td><td>{money(c.contract_price)}</td><td>{c.payment_terms}</td><td><span className="pill">{c.status}</span></td></tr>):<tr><td colSpan={5}>No contracts created yet.</td></tr>}</tbody></table></div></>;
}
