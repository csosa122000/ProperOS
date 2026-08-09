'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SalesGoalManager({organizationId,periodMonth,monthlyGoal,annualGoal,userId}:{organizationId:string;periodMonth:string;monthlyGoal:number;annualGoal:number;userId:string}){
  const router=useRouter();
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setSaving(true);setMessage('');const fd=new FormData(e.currentTarget);const supabase=createClient();
    const {error}=await supabase.from('sales_goals').upsert({organization_id:organizationId,period_month:periodMonth,monthly_team_goal:Number(fd.get('monthlyGoal')||0),annual_team_goal:Number(fd.get('annualGoal')||0),created_by:userId,updated_by:userId,updated_at:new Date().toISOString()},{onConflict:'organization_id,period_month'});
    if(error){setMessage(error.message);setSaving(false);return;}
    setMessage('Sales goals updated.');setSaving(false);router.refresh();
  }
  return <form className="card section" onSubmit={submit}><h2>Admin Sales Goals</h2><p>Set the company sales targets used for Company Pulse and Sales on-pace calculations.</p><div className="form-grid"><label className="field">Monthly team goal<input name="monthlyGoal" type="number" min="0" step="1000" defaultValue={monthlyGoal}/></label><label className="field">Annual team goal<input name="annualGoal" type="number" min="0" step="1000" defaultValue={annualGoal}/></label></div>{message&&<p>{message}</p>}<button className="primary button-auto" disabled={saving}>{saving?'Saving…':'Save goals'}</button></form>;
}
