import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppointmentAcknowledgeButton } from '@/components/appointment-acknowledge-button';
import { createClient } from '@/lib/supabase/server';

const dt=(v:string)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v));
type Detail={appointment_id:string;lead_id:string|null;title:string;starts_at:string;ends_at:string;status:string;customer_name:string;phone:string|null;email:string|null;project_type:string;notes:string|null;acknowledged_at:string|null;address_line1:string|null;address_line2:string|null;city:string|null;state:string|null;postal_code:string|null};

export default async function AppointmentDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)notFound();
  const {data,error}=await supabase.rpc('get_sales_appointment_detail',{target_appointment_id:id});if(error||!data?.length)notFound();const a=data[0] as Detail;const unlocked=Boolean(a.address_line1||a.acknowledged_at);
  return <>
    <div className="top"><div><h1>{a.customer_name||'Sales Appointment'}</h1><p>{a.project_type||'Project'} · {dt(a.starts_at)}</p></div><Link className="secondary button-auto" href="/appointments">Back to Appointments</Link></div>
    {!unlocked&&<section className="card section"><h2>Appointment acknowledgment required</h2><p>This appointment has been assigned to you. The customer's job-site address is intentionally hidden until you acknowledge that you have received and accepted responsibility for this appointment.</p><p><strong>By acknowledging, Proper OS records your user ID and the exact acknowledgment time.</strong></p><AppointmentAcknowledgeButton appointmentId={a.appointment_id}/></section>}
    <section className="module-grid section">
      <div className="card"><h3>Appointment</h3><p><strong>Start:</strong> {dt(a.starts_at)}</p><p><strong>Status:</strong> {a.status.replaceAll('_',' ')}</p><p><strong>Acknowledged:</strong> {a.acknowledged_at?dt(a.acknowledged_at):'Not yet'}</p></div>
      <div className="card"><h3>Customer</h3><p>{a.customer_name}</p><p>{a.phone||'No phone on file'}</p><p>{a.email||'No email on file'}</p></div>
      <div className="card"><h3>Project</h3><p>{a.project_type||'Project'}</p><p>{a.notes||'No appointment notes.'}</p></div>
    </section>
    <section className="card section"><h2>Job-Site Address</h2>{unlocked?<><p><strong>{a.address_line1}{a.address_line2?`, ${a.address_line2}`:''}</strong></p><p>{[a.city,a.state,a.postal_code].filter(Boolean).join(', ').replace(', ,',', ')}</p></>:<p><strong>🔒 Address locked until appointment acknowledgment.</strong></p>}</section>
    {unlocked&&<section className="card section"><h2>Appointment Workspace</h2><div className="module-grid"><Link className="card module-link" href={`/estimates?lead=${a.lead_id||''}`}><h3>Build Estimate</h3><p>Open estimating for this customer.</p><span>Open estimates →</span></Link><Link className="card module-link" href={`/proposals?lead=${a.lead_id||''}`}><h3>Proposal</h3><p>Create or review the customer proposal.</p><span>Open proposals →</span></Link><Link className="card module-link" href="/sales"><h3>Disposition & Pipeline</h3><p>Update the sales stage, follow-up and disposition.</p><span>Open sales →</span></Link></div></section>}
  </>;
}
