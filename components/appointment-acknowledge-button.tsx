'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AppointmentAcknowledgeButton({appointmentId}:{appointmentId:string}){
  const [saving,setSaving]=useState(false);const [error,setError]=useState('');const router=useRouter();
  async function acknowledge(){
    setSaving(true);setError('');
    const supabase=createClient();
    const {error:e}=await supabase.rpc('acknowledge_sales_appointment',{target_appointment_id:appointmentId});
    if(e){setError(e.message);setSaving(false);return;}
    router.refresh();
  }
  return <div><button className="primary button-auto" onClick={acknowledge} disabled={saving}>{saving?'Acknowledging…':'Acknowledge Appointment & Reveal Address'}</button>{error&&<p className="error" role="alert">{error}</p>}</div>;
}
