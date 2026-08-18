'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AccountingFundingAction({jobId,eligible}:{jobId:string;eligible:boolean}){
  const router=useRouter();
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');

  async function markFunded(){
    if(!eligible)return;
    const confirmed=window.confirm('Confirm that the customer deposit/payment has posted to Proper Remodeling’s bank account. This will mark the job Funded and release the sale for credited volume.');
    if(!confirmed)return;
    setSaving(true);setMessage('');
    const supabase=createClient();
    const {error}=await supabase.rpc('mark_accounting_job_funded',{target_accounting_job_id:jobId});
    if(error){setMessage(error.message);setSaving(false);return;}
    setMessage('Deposit received. Job marked Funded.');
    setSaving(false);
    router.refresh();
  }

  return <div>
    <button className="primary button-auto" type="button" disabled={!eligible||saving} onClick={markFunded}>{saving?'Saving…':'Mark Deposit Received / Funded'}</button>
    {message&&<p>{message}</p>}
  </div>;
}
