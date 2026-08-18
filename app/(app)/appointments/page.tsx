import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const dt=(v:string)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v));
type Row={appointment_id:string;lead_id:string|null;title:string;starts_at:string;ends_at:string;status:string;customer_name:string;project_type:string;acknowledged_at:string|null;address_unlocked:boolean};

export default async function Appointments(){
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(user)await supabase.rpc('claim_pending_memberships');const {data:orgs}=await supabase.rpc('get_my_organizations');const org=orgs?.[0];
  if(!user||!org)return <div className="card"><h1>Appointments</h1><p>Your workspace must be active.</p></div>;
  const {data}=await supabase.rpc('get_sales_appointments',{target_organization_id:org.organization_id});const rows=(data||[]) as Row[];
  return <><div className="top"><div><h1>Sales Appointments</h1><p>Assigned appointments appear here. Sales representatives must acknowledge an appointment before the job-site address is released.</p></div></div>
  <section className="card section"><table className="table"><thead><tr><th>Date / Time</th><th>Customer</th><th>Project</th><th>Status</th><th>Address Access</th><th></th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.appointment_id}><td>{dt(r.starts_at)}</td><td><strong>{r.customer_name||'Customer'}</strong></td><td>{r.project_type||'Project'}</td><td><span className="pill">{r.status.replaceAll('_',' ')}</span></td><td>{r.address_unlocked?<span className="pill">Acknowledged</span>:<strong>Locked until acknowledgment</strong>}</td><td><Link className="secondary button-auto" href={`/appointments/${r.appointment_id}`}>{r.address_unlocked?'Open Appointment':'Review & Acknowledge'}</Link></td></tr>):<tr><td colSpan={6}>No assigned appointments.</td></tr>}</tbody></table></section></>;
}
