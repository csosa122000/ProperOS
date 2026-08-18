import { NewLeadForm } from '@/components/new-lead-form';
import { createClient } from '@/lib/supabase/server';

type SalesRep={workforce_member_id:string;linked_user_id:string|null;display_name:string;job_title:string|null;branch_id:string|null;sales_activation_status:string};

export default async function Marketing(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user)await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];
  const {data:roster}=org?await supabase.rpc('get_active_sales_roster',{target_organization_id:org.organization_id}):{data:[]};
  const assignees=((roster||[]) as SalesRep[]).map(rep=>({workforceMemberId:rep.workforce_member_id,linkedUserId:rep.linked_user_id,name:rep.display_name,jobTitle:rep.job_title,branchId:rep.branch_id,activationStatus:rep.sales_activation_status}));
  return <>
    <div className="top"><div><h1>Marketing</h1><p>Add and assign leads, track lead sources, campaigns, spend, and return.</p></div>{user&&org&&<NewLeadForm organizationId={org.organization_id} branchId={org.default_branch_id} currentUserId={user.id} assignees={assignees}/>}</div>
    <section className="grid section"><div className="card metric"><span>Marketing spend</span><strong>$0</strong></div><div className="card metric"><span>Marketing leads</span><strong>0</strong></div><div className="card metric"><span>Cost per lead</span><strong>$0</strong></div><div className="card metric"><span>Revenue attributed</span><strong>$0</strong></div></section>
    <section className="module-grid section"><div className="card"><h3>Lead intake & assignment</h3><p>Marketing can assign opportunities to every active sales workforce member, including reps whose Proper OS login is still pending.</p></div><div className="card"><h3>Campaigns</h3><p>Organize canvassing, telemarketing, digital, referral, and local campaigns.</p></div><div className="card"><h3>Lead-source reporting</h3><p>Compare lead volume, appointments, full demos, sales, and attributed revenue.</p></div></section>
  </>;
}
