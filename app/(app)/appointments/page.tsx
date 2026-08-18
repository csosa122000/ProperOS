import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const dt=(v:string)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v));
type Row={appointment_id:string;lead_id:string|null;title:string;starts_at:string;ends_at:string;status:string;customer_name:string;project_type:string;acknowledged_at:string|null;address_unlocked:boolean};
type AlertRow={appointment_id:string;lead_id:string|null;customer_name:string;project_type:string;starts_at:string;assigned_rep_name:string;minutes_until_start:number};

export default async function Appointments(){
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(user)await supabase.rpc('claim_pending_memberships');const {data:orgs}=await supabase.rpc('get_my_organizations');const org=orgs?.[0];
  if(!user||!org)return <div className="card"><h1>Appointments</h1><p>Your workspace must be active.</p></div>;
  const [{data},{data:alertData}]=await Promise.all([
    supabase.rpc('get_sales_appointments',{target_organization_id:org.organization_id}),
    supabase.rpc('get_unacknowledged_sales_appointment_alerts',{target_organization_id:org.organization_id}),
  ]);
  const rows=(data||[]) as Row[];const alerts=(alertData||[]) as AlertRow[];const alertIds=new Set(alerts.map(a=>a.appointment_id));
  return <><div className="top"><div><h1>Sales Appointments</h1><p>Assigned appointments appear here. Sales representatives must acknowledge an appointment before the job-site address is released.</p></div></div>
  {alerts.length>0&&<section className="card section" style={{border:'2px solid #dc2626'}}><div className="top"><div><h2>⚠ Unacknowledged Appointment Alert</h2><p>These appointments start within one hour and have not been acknowledged by the assigned salesperson.</p></div><span className="pill">{alerts.length} alert{alerts.length===1?'':'s'}</span></div><table className="table"><thead><tr><th>Starts</th><th>Sales Representative</th><th>Customer</th><th>Project</th><th>Time Remaining</th><th></th></tr></thead><tbody>{alerts.map(a=><tr key={a.appointment_id}><td><strong>{dt(a.starts_at)}</strong></td><td><strong>{a.assigned_rep_name}</strong></td><td>{a.customer_name||'Customer'}</td><td>{a.project_type||'Project'}</td><td><strong>{a.minutes_until_start<=0?'Starting now':`${a.minutes_until_start} min`}</strong></td><td><Link className="secondary button-auto" href={`/appointments/${a.appointment_id}`}>Review Appointment</Link></td></tr>)}</tbody></table></section>}
  <section className="card section"><table className="table"><thead><tr><th>Date / Time</th><th>Customer</th><th>Project</th><th>Status</th><th>Address Access</th><th></th></tr></thead><tbody>{rows.length?rows.map(r=>{const urgent=alertIds.has(r.appointment_id);return <tr key={r.appointment_id}><td>{dt(r.starts_at)}</td><td><strong>{r.customer_name||'Customer'}</strong></td><td>{r.project_type||'Project'}</td><td>{urgent?<span className="pill">⚠ Acknowledgment Required</span>:<span className="pill">{r.status.replaceAll('_',' ')}</span>}</td><td>{r.address_unlocked?<span className="pill">Acknowledged</span>:<strong>{urgent?'URGENT — Address Locked':'Locked until acknowledgment'}</strong>}</td><td><Link className="secondary button-auto" href={`/appointments/${r.appointment_id}`}>{r.address_unlocked?'Open Appointment':urgent?'Acknowledge Now':'Review & Acknowledge'}</Link></td></tr>}):<tr><td colSpan={6}>No assigned appointments.</td></tr>}</tbody></table></section></>;
}
