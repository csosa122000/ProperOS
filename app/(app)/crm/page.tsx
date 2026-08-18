import { NewLeadForm } from '@/components/new-lead-form';
import { createClient } from '@/lib/supabase/server';

type Lead = {id:string;first_name:string;last_name:string;phone:string|null;email:string|null;source:string|null;status:string;project_interest:string[]|null;created_at:string};
type SalesRep={workforce_member_id:string;linked_user_id:string|null;display_name:string;job_title:string|null;branch_id:string|null;sales_activation_status:string};

export default async function CRM() {
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user)await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];
  let leads:Lead[]=[];let reps:SalesRep[]=[];
  if(org){
    const [{data:leadRows},{data:roster}]=await Promise.all([
      supabase.from('leads').select('id,first_name,last_name,phone,email,source,status,project_interest,created_at').eq('organization_id',org.organization_id).is('deleted_at',null).order('created_at',{ascending:false}),
      supabase.rpc('get_active_sales_roster',{target_organization_id:org.organization_id})
    ]);
    leads=(leadRows||[]) as Lead[];reps=(roster||[]) as SalesRep[];
  }
  if(!org||!user)return <div className="card empty-state"><h1>Finish workspace setup</h1><p>Your company invitation has not been activated. Sign out and sign in again to connect your Proper Remodeling workspace.</p></div>;
  const assignees=reps.map(rep=>({workforceMemberId:rep.workforce_member_id,linkedUserId:rep.linked_user_id,name:rep.display_name,jobTitle:rep.job_title,branchId:rep.branch_id,activationStatus:rep.sales_activation_status}));
  return <>
    <div className="top"><div><h1>CRM</h1><p>Capture new opportunities and keep the sales pipeline moving.</p></div><NewLeadForm organizationId={org.organization_id} branchId={org.default_branch_id} currentUserId={user.id} assignees={assignees}/></div>
    <div className="card"><table className="table"><thead><tr><th>Name</th><th>Contact</th><th>Project</th><th>Source</th><th>Status</th><th>Added</th></tr></thead><tbody>{leads.length?leads.map(lead=><tr key={lead.id}><td><strong>{lead.first_name} {lead.last_name}</strong></td><td>{lead.phone||lead.email||'—'}</td><td>{lead.project_interest?.join(', ')||'—'}</td><td>{lead.source||'—'}</td><td><span className="pill">{lead.status.replaceAll('_',' ')}</span></td><td>{new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(lead.created_at))}</td></tr>):<tr><td colSpan={6} className="empty-cell">No leads yet. Add your first opportunity to get started.</td></tr>}</tbody></table></div>
  </>;
}
