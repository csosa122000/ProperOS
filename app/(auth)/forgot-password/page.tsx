'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPassword() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage('Check your email for a password reset link.');
    setLoading(false);
  }

  return (
    <main className="auth">
      <section className="auth-brand">
        <h1>Proper OS</h1>
        <p>Secure access for your Proper Remodeling team.</p>
      </section>
      <section className="auth-panel">
        <form className="card login-card" onSubmit={submit}>
          <h2>Recover password</h2>
          <p>Enter the email address tied to your Proper OS account.</p>
          <label className="field">
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          {error && <p className="error">{error}</p>}
          {message && <p>{message}</p>}
          <button className="primary" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
          <p><Link href="/login">Back to sign in</Link></p>
        </form>
      </section>
    </main>
  );
}
