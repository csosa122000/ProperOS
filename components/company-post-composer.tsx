'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function CompanyPostComposer({organizationId,userId}:{organizationId:string;userId:string}){
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setMessage('');
    const form=event.currentTarget;const data=new FormData(form);
    const title=String(data.get('title')||'').trim();
    const body=String(data.get('body')||'').trim();
    const audience=String(data.get('audience')||'all').trim();
    const expires=String(data.get('expires_at')||'').trim();
    if(!title||!body){setMessage('Title and announcement are required.');setSaving(false);return;}
    const supabase=createClient();
    const {error}=await supabase.from('company_posts').insert({
      organization_id:organizationId,
      title,
      body,
      audience_department:audience==='all'?null:audience,
      is_published:true,
      published_at:new Date().toISOString(),
      expires_at:expires?new Date(expires).toISOString():null,
      created_by:userId,
    });
    if(error){setMessage(error.message);setSaving(false);return;}
    form.reset();setSaving(false);setMessage('Announcement published.');setOpen(false);router.refresh();
  }

  return <>
    <button className="primary button-auto" type="button" onClick={()=>setOpen(true)}>New Announcement</button>
    {open&&<div className="modal-backdrop" role="presentation"><div className="modal card" role="dialog" aria-modal="true" aria-labelledby="company-post-title">
      <div className="modal-header"><div><h2 id="company-post-title">Company Announcement</h2><p>Publish an announcement to the full company or one department.</p></div><button className="icon-button" type="button" aria-label="Close" onClick={()=>setOpen(false)}>×</button></div>
      <form onSubmit={submit}>
        <label className="field">Title<input name="title" required placeholder="Team announcement"/></label>
        <label className="field">Announcement<textarea name="body" rows={5} required placeholder="Write the company update here."/></label>
        <div className="form-grid">
          <label className="field">Audience<select name="audience" defaultValue="all"><option value="all">Entire company</option><option value="sales">Sales</option><option value="production">Production</option><option value="marketing">Marketing</option><option value="canvassing">Canvassing</option><option value="telemarketing">Telemarketing</option><option value="accounting">Accounting</option><option value="human_resources">Human Resources</option></select></label>
          <label className="field">Expires (optional)<input name="expires_at" type="datetime-local"/></label>
        </div>
        {message&&<p>{message}</p>}
        <div className="modal-actions"><button className="secondary" type="button" onClick={()=>setOpen(false)} disabled={saving}>Cancel</button><button className="primary button-auto" disabled={saving}>{saving?'Publishing…':'Publish'}</button></div>
      </form>
    </div></div>}
  </>;
}
