'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePassword(){
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); setLoading(true); setError(''); setMessage('');
    const fd=new FormData(e.currentTarget); const password=String(fd.get('password')); const confirm=String(fd.get('confirm'));
    if(password.length<8){setError('Password must be at least 8 characters.');setLoading(false);return;}
    if(password!==confirm){setError('Passwords do not match.');setLoading(false);return;}
    const supabase=createClient();
    const {error}=await supabase.auth.updateUser({password});
    if(error){setError(error.message);setLoading(false);return;}
    setMessage('Password updated. You can now sign in with your new password.'); setLoading(false);
  }
  return <main className="auth"><section className="auth-brand"><h1>Proper OS</h1><p>Secure account recovery for your Proper Remodeling workspace.</p></section><section className="auth-panel"><form className="card login-card" onSubmit={submit}><h2>Create a new password</h2><p>Enter and confirm your new password.</p><label className="field">New password<input name="password" type="password" minLength={8} required/></label><label className="field">Confirm password<input name="confirm" type="password" minLength={8} required/></label>{error&&<p className="error">{error}</p>}{message&&<p>{message}</p>}<button className="primary" disabled={loading}>{loading?'Updating…':'Update password'}</button><p><Link href="/login">Return to sign in</Link></p></form></section></main>;
}
