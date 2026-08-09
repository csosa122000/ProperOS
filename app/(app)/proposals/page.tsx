import { ProposalWorkflow } from '@/components/proposal-workflow';
import { createClient } from '@/lib/supabase/server';

export default async function Proposals(){
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(user)await supabase.rpc('claim_pending_memberships');const {data:orgs}=await supabase.rpc('get_my_organizations');const org=orgs?.[0];
  if(!user||!org)return <div className="card"><h1>Proposal Generator</h1><p>Your workspace must be active.</p></div>;
  const {data:estimates}=await supabase.from('estimates').select('id,estimate_number,project_name,title,project_address,category_slug,ninety_day_price,today_price,status').eq('organization_id',org.organization_id).order('created_at',{ascending:false});
  const {data:proposals}=await supabase.from('customer_proposals').select('id,estimate_id,proposal_number,title,status,accepted_by_name,accepted_at,created_at').eq('organization_id',org.organization_id).order('created_at',{ascending:false});
  const normalized=(estimates||[]).map((e:any)=>({...e,ninety_day_price:Number(e.ninety_day_price),today_price:Number(e.today_price)}));
  return <><div className="top"><div><h1>Proposal Generator</h1><p>Generate the approved condensed Proper Remodeling proposal from a saved estimate. Once accepted, move directly into contract creation.</p></div></div><ProposalWorkflow organizationId={org.organization_id} userId={user.id} estimates={normalized} initialProposals={(proposals||[]) as any}/></>;
}
