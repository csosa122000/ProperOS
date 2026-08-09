'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ContractRow={id:string;contract_number:string;status:string;cancellation_notice_acknowledged:boolean|null};

export function ContractActions({contract,userId}:{contract:ContractRow;userId:string}){
  const [status,setStatus]=useState(contract.status);
  const [ack,setAck]=useState(Boolean(contract.cancellation_notice_acknowledged));
  const [message,setMessage]=useState('');
  const [saving,setSaving]=useState(false);

  async function markReady(){
    setSaving(true);setMessage('');
    const supabase=createClient();
    const {error}=await supabase.from('contracts').update({status:'ready_for_signature',updated_by:userId}).eq('id',contract.id).eq('status','draft');
    if(error){setMessage(error.message);}else{setStatus('ready_for_signature');setMessage('Contract is ready for signature.');}
    setSaving(false);
  }

  async function sign(){
    if(!ack){setMessage('Acknowledge the 3-day cancellation notice before signing.');return;}
    const signer=window.prompt('Name of homeowner signing this contract:');
    if(!signer)return;
    const representative=window.prompt('Name of company representative signing this contract:');
    if(!representative)return;
    setSaving(true);setMessage('');
    const supabase=createClient();
    const signedAt=new Date().toISOString();
    const {error}=await supabase.from('contracts').update({
      status:'signed',
      signed_at:signedAt,
      agreement_effective_date:signedAt.slice(0,10),
      cancellation_notice_acknowledged:true,
      representative_name:representative,
      general_terms:{signature:{homeowner:signer,representative,signed_at:signedAt},cancellation_notice_acknowledged:true},
      updated_by:userId,
    }).eq('id',contract.id).eq('status','ready_for_signature');
    if(error){setMessage(error.message);}else{setStatus('signed');setMessage('Contract signed. Production, Sales, and Accounting handoffs have been triggered.');}
    setSaving(false);
  }

  if(status==='signed') return <span className="pill">signed</span>;
  if(status==='void') return <span className="pill">void</span>;
  return <div style={{display:'grid',gap:6,minWidth:190}}>
    {status==='draft'&&<button type="button" className="secondary" disabled={saving} onClick={markReady}>Ready for Signature</button>}
    {status==='ready_for_signature'&&<>
      <label style={{display:'flex',gap:6,alignItems:'center',fontSize:12}}><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>3-day cancellation notice acknowledged</label>
      <button type="button" className="primary button-auto" disabled={saving} onClick={sign}>Sign Contract</button>
    </>}
    {message&&<small>{message}</small>}
  </div>;
}
