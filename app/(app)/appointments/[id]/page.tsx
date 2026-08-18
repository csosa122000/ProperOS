import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppointmentAcknowledgeButton } from '@/components/appointment-acknowledge-button';
import { createClient } from '@/lib/supabase/server';

const dt=(v:string|null)=>v?new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v)):'—';
const d=(v:string|null)=>v?new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric'}).format(new Date(v)):'—';
const money=(n:number|null)=>n==null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));

type Detail={appointment_id:string;lead_id:string|null;title:string;starts_at:string;ends_at:string;status:string;customer_name:string;phone:string|null;email:string|null;project_type:string;notes:string|null;acknowledged_at:string|null;address_line1:string|null;address_line2:string|null;city:string|null;state:string|null;postal_code:string|null};
type Lead={id:string;customer_id:string;status:string;source:string|null;pipeline_stage:string|null;disposition:string|null;next_follow_up_at:string|null;expected_close_date:string|null;sale_amount:number|null;project_interest:string[]|null;created_at:string;updated_at:string};

const pretty=(value:string|null|undefined)=>value?value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()):'—';

export default async function AppointmentDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)notFound();
  const {data,error}=await supabase.rpc('get_sales_appointment_detail',{target_appointment_id:id});
  if(error||!data?.length)notFound();
  const a=data[0] as Detail;
  const unlocked=Boolean(a.address_line1||a.acknowledged_at);

  let lead:Lead|null=null;
  if(a.lead_id){
    const {data:leadRow}=await supabase.from('leads').select('id,customer_id,status,source,pipeline_stage,disposition,next_follow_up_at,expected_close_date,sale_amount,project_interest,created_at,updated_at').eq('id',a.lead_id).maybeSingle();
    lead=(leadRow||null) as Lead|null;
  }

  const address=unlocked?[a.address_line1,a.address_line2,a.city,a.state,a.postal_code].filter(Boolean).join(', '):null;
  const tel=a.phone?`tel:${a.phone.replace(/[^\d+]/g,'')}`:'#';
  const mail=a.email?`mailto:${a.email}`:'#';
  const estimateHref=`/estimates${a.lead_id?`?lead=${a.lead_id}`:''}`;
  const proposalHref=`/proposals${a.lead_id?`?lead=${a.lead_id}`:''}`;
  const contractHref=`/contracts${a.lead_id?`?lead=${a.lead_id}`:''}`;

  const timeline=[
    lead?.created_at&&{label:'Lead created',time:lead.created_at,detail:lead.source?`Source: ${pretty(lead.source)}`:'Customer entered Proper OS'},
    {label:'Appointment scheduled',time:a.starts_at,detail:a.project_type||'Sales appointment'},
    a.acknowledged_at&&{label:'Appointment acknowledged',time:a.acknowledged_at,detail:'Address access released to assigned salesperson'},
    lead?.updated_at&&{label:'Customer record last updated',time:lead.updated_at,detail:`Pipeline: ${pretty(lead.pipeline_stage)} · Disposition: ${pretty(lead.disposition)}`},
  ].filter(Boolean) as {label:string;time:string;detail:string}[];

  return <>
    <div className="top"><div><h1>{a.customer_name||'Sales Appointment'}</h1><p>{a.project_type||'Project'} · {dt(a.starts_at)}{lead?.customer_id?` · ${lead.customer_id}`:''}</p></div><Link className="secondary button-auto" href="/appointments">Back to Appointments</Link></div>

    {!unlocked&&<section className="card section"><h2>Appointment acknowledgment required</h2><p>This appointment has been assigned to you. The customer's job-site address is intentionally hidden until you acknowledge that you have received and accepted responsibility for this appointment.</p><p><strong>By acknowledging, Proper OS records your user ID and the exact acknowledgment time.</strong></p><AppointmentAcknowledgeButton appointmentId={a.appointment_id}/></section>}

    <section className="module-grid section">
      <div className="card"><h3>Appointment</h3><p><strong>Start:</strong> {dt(a.starts_at)}</p><p><strong>End:</strong> {dt(a.ends_at)}</p><p><strong>Status:</strong> <span className="pill">{pretty(a.status)}</span></p><p><strong>Acknowledged:</strong> {a.acknowledged_at?dt(a.acknowledged_at):'Not yet'}</p></div>
      <div className="card"><h3>Customer</h3><p><strong>{a.customer_name}</strong></p><p>{a.phone||'No phone on file'}</p><p>{a.email||'No email on file'}</p><div className="actions">{a.phone&&<a className="secondary button-auto" href={tel}>Call</a>}{a.email&&<a className="secondary button-auto" href={mail}>Email</a>}</div></div>
      <div className="card"><h3>Project</h3><p><strong>{a.project_type||lead?.project_interest?.join(', ')||'Project'}</strong></p><p><strong>Lead source:</strong> {pretty(lead?.source)}</p><p><strong>Lead status:</strong> {pretty(lead?.status)}</p><p>{a.notes||'No appointment notes.'}</p></div>
    </section>

    <section className="card section"><div className="top"><div><h2>Job-Site Address</h2><p>The address remains protected until the assigned salesperson acknowledges the appointment.</p></div>{address&&<a className="secondary button-auto" href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">Open Map</a>}</div>{unlocked?<><p><strong>{a.address_line1}{a.address_line2?`, ${a.address_line2}`:''}</strong></p><p>{[a.city,a.state,a.postal_code].filter(Boolean).join(', ').replace(', ,',', ')}</p></>:<p><strong>🔒 Address locked until appointment acknowledgment.</strong></p>}</section>

    {unlocked&&<>
      <section className="card section"><h2>Sales Command Center</h2><p>Use this appointment as the working record for the entire sales visit.</p><div className="module-grid">
        <Link className="card module-link" href={estimateHref}><h3>Build Estimate</h3><p>Open the Proper Remodeling master-pricing estimator for this customer.</p><span>Open estimates →</span></Link>
        <Link className="card module-link" href={proposalHref}><h3>Proposal</h3><p>Create or review the customer-facing proposal after pricing is approved.</p><span>Open proposals →</span></Link>
        <Link className="card module-link" href={contractHref}><h3>Contract</h3><p>Create or review the contract after the proposal is accepted.</p><span>Open contracts →</span></Link>
        <Link className="card module-link" href="/sales"><h3>Disposition & Pipeline</h3><p>Update outcome, pipeline stage, follow-up and expected close.</p><span>Open sales →</span></Link>
      </div></section>

      <section className="module-grid section">
        <div className="card"><h3>Pipeline & Follow-Up</h3><p><strong>Pipeline:</strong> {pretty(lead?.pipeline_stage)}</p><p><strong>Disposition:</strong> {pretty(lead?.disposition)}</p><p><strong>Next follow-up:</strong> {dt(lead?.next_follow_up_at||null)}</p><p><strong>Expected close:</strong> {d(lead?.expected_close_date||null)}</p><p><strong>Sale amount:</strong> {money(lead?.sale_amount??null)}</p><Link className="secondary button-auto" href="/sales">Update in Sales</Link></div>
        <div className="card"><h3>Notes & Visit Context</h3><p>{a.notes||'No appointment notes have been entered.'}</p><p><strong>Project interests:</strong> {lead?.project_interest?.length?lead.project_interest.join(', '):a.project_type||'—'}</p><p><strong>Customer ID:</strong> {lead?.customer_id||'—'}</p></div>
        <div className="card"><h3>Photos & Documents</h3><p>This record is the home for sales photos, measurements and supporting documents. Photo upload/storage will be connected to the live media tables once database connector access is restored.</p><p><strong>Do not store project photos only on a personal phone.</strong></p></div>
      </section>

      <section className="card section"><h2>Activity Timeline</h2><div>{timeline.sort((x,y)=>new Date(x.time).getTime()-new Date(y.time).getTime()).map((item,index)=><div key={`${item.label}-${index}`} style={{padding:'12px 0',borderBottom:index<timeline.length-1?'1px solid #e5e7eb':'none'}}><strong>{item.label}</strong><div>{dt(item.time)}</div><small>{item.detail}</small></div>)}</div></section>
    </>}
  </>;
}
