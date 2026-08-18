'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const stages=[
  ['new_lead','New Lead'],
  ['appointment_set','Appointment Set'],
  ['in_progress','In Progress'],
  ['estimate_proposal','Estimate / Proposal'],
  ['follow_up','Follow-Up'],
  ['contract_signed','Contract Signed'],
  ['lost','Lost / No Sale'],
] as const;

export function SalesPipelineStageSelect({leadId,value,locked=false}:{leadId:string;value:string;locked?:boolean}){
  const router=useRouter();
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  async function change(next:string){
    if(locked)return;
    setSaving(true);setMessage('');
    const supabase=createClient();
    const {error}=await supabase.from('leads').update({pipeline_stage:next,updated_at:new Date().toISOString()}).eq('id',leadId);
    if(error){setMessage(error.message);setSaving(false);return;}
    setMessage('Saved');setSaving(false);router.refresh();
  }
  return <div>
    <select value={value} disabled={locked||saving} onChange={e=>change(e.target.value)} aria-label="Pipeline stage">
      {stages.map(([key,label])=><option key={key} value={key}>{label}</option>)}
    </select>
    {locked&&<small> System managed</small>}
    {message&&<small> {message}</small>}
  </div>;
}
