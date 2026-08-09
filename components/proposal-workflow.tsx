'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Estimate={id:string;estimate_number:string|null;project_name:string|null;title:string;project_address:string|null;category_slug:string;ninety_day_price:number;today_price:number;status:string};
type Proposal={id:string;estimate_id:string;proposal_number:string;title:string;status:string;accepted_by_name:string|null;accepted_at:string|null;created_at:string};

export function ProposalWorkflow({organizationId,userId,estimates,initialProposals}:{organizationId:string;userId:string;estimates:Estimate[];initialProposals:Proposal[]}){
  const [proposals,setProposals]=useState(initialProposals);
  const [message,setMessage]=useState('');
  const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0));
  async function generate(e:Estimate){
    setMessage('');const supabase=createClient();const number=`PRP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const content={brand:'Proper Remodeling',layout:'condensed_one_project',estimate_number:e.estimate_number,project:e.project_name||e.title,address:e.project_address,pricing:{ninety_day:e.ninety_day_price,today:e.today_price},workflow:{accepted_creates_contract:true}};
    const {data,error}=await supabase.from('customer_proposals').insert({organization_id:organizationId,estimate_id:e.id,proposal_number:number,template_name:'Proper Remodeling AI Proposal',title:e.project_name||e.title,scope_summary:`${e.category_slug.replaceAll('-',' ')} project based on the approved estimate.`,proposal_content:content,status:'draft',created_by:userId}).select('id,estimate_id,proposal_number,title,status,accepted_by_name,accepted_at,created_at').single();
    if(error){setMessage(error.message);return;}setProposals([data as Proposal,...proposals]);setMessage(`${number} generated from the approved Proper Remodeling proposal template.`);
  }
  async function accept(p:Proposal){
    const name=window.prompt('Customer name accepting this proposal:');if(!name)return;const supabase=createClient();const acceptedAt=new Date().toISOString();const {error}=await supabase.from('customer_proposals').update({status:'accepted',accepted_by_name:name,accepted_at:acceptedAt,updated_by:userId}).eq('id',p.id);if(error){setMessage(error.message);return;}setProposals(proposals.map(x=>x.id===p.id?{...x,status:'accepted',accepted_by_name:name,accepted_at:acceptedAt}:x));setMessage('Proposal accepted. Create Contract is now available.');
  }
  const hasProposal=(estimateId:string)=>proposals.some(p=>p.estimate_id===estimateId);
  return <>
    {message&&<div className="card section"><p>{message}</p></div>}
    <div className="card section"><h2>Estimates ready for proposal</h2><table className="table"><thead><tr><th>Estimate</th><th>Project</th><th>90-Day</th><th>Today</th><th>Action</th></tr></thead><tbody>{estimates.length?estimates.map(e=><tr key={e.id}><td>{e.estimate_number||'Draft'}</td><td>{e.project_name||e.title}</td><td>{money(e.ninety_day_price)}</td><td>{money(e.today_price)}</td><td>{hasProposal(e.id)?<span className="pill">Proposal generated</span>:<button className="secondary" onClick={()=>generate(e)}>Generate AI Proposal</button>}</td></tr>):<tr><td colSpan={5}>No saved estimates yet.</td></tr>}</tbody></table></div>
    <div className="card section"><h2>Customer proposals</h2><table className="table"><thead><tr><th>Proposal</th><th>Project</th><th>Status</th><th>Accepted by</th><th>Next step</th></tr></thead><tbody>{proposals.length?proposals.map(p=><tr key={p.id}><td>{p.proposal_number}</td><td>{p.title}</td><td><span className="pill">{p.status}</span></td><td>{p.accepted_by_name||'—'}</td><td>{p.status==='accepted'?<Link className="primary button-auto link-button" href={`/contracts?proposal=${p.id}`}>Create Contract</Link>:<button className="secondary" onClick={()=>accept(p)}>Mark Accepted</button>}</td></tr>):<tr><td colSpan={5}>No proposals generated yet.</td></tr>}</tbody></table></div>
  </>;
}
