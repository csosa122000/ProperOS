'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  organizationId: string;
  branchId: string | null;
  currentUserId: string;
};

const projectTypes = [
  'Kitchen',
  'Bathroom',
  'Basement',
  'Addition',
  'Whole home',
  'Exterior',
  'Other',
];

export function NewLeadForm({ organizationId, branchId, currentUserId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const form = event.currentTarget;
    const data = new FormData(form);
    const appointment = String(data.get('appointment') || '').trim();
    const payload = {
      organization_id: organizationId,
      branch_id: branchId,
      first_name: String(data.get('first_name') || '').trim(),
      last_name: String(data.get('last_name') || '').trim(),
      phone: String(data.get('phone') || '').trim() || null,
      email: String(data.get('email') || '').trim() || null,
      preferred_contact_method: String(data.get('preferred_contact_method') || 'phone'),
      lead_source: String(data.get('lead_source') || '').trim() || null,
      project_type: String(data.get('project_type') || '').trim(),
      status: String(data.get('status') || 'new'),
      notes: String(data.get('notes') || '').trim() || null,
      assigned_to: data.get('assigned_to') === 'me' ? currentUserId : null,
      address_line1: String(data.get('address_line1') || '').trim(),
      address_line2: String(data.get('address_line2') || '').trim() || null,
      city: String(data.get('city') || '').trim(),
      state: String(data.get('state') || '').trim().toUpperCase(),
      postal_code: String(data.get('postal_code') || '').trim(),
      appointment_starts_at: appointment ? new Date(appointment).toISOString() : null,
    };

    const supabase = createClient();
    const { error: saveError } = await supabase.rpc('create_lead_with_details', {
      payload,
    });

    if (saveError) {
      setError(saveError.message || 'The lead could not be saved.');
      setSaving(false);
      return;
    }

    form.reset();
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="primary button-auto" onClick={() => setOpen(true)}>
        New Lead
      </button>
      {open && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal card" role="dialog" aria-modal="true" aria-labelledby="new-lead-title">
            <div className="modal-header">
              <div>
                <h2 id="new-lead-title">New lead</h2>
                <p>Add the contact, project, job site, and next appointment.</p>
              </div>
              <button className="icon-button" type="button" aria-label="Close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={submit}>
              <div className="form-section">
                <h3>Customer</h3>
                <div className="form-grid">
                  <label className="field">First name<input name="first_name" required autoFocus /></label>
                  <label className="field">Last name<input name="last_name" required /></label>
                  <label className="field">Phone<input name="phone" type="tel" /></label>
                  <label className="field">Email<input name="email" type="email" /></label>
                  <label className="field">Preferred contact
                    <select name="preferred_contact_method" defaultValue="phone">
                      <option value="phone">Phone</option>
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                    </select>
                  </label>
                  <label className="field">Lead source
                    <select name="lead_source" defaultValue="">
                      <option value="">Select source</option>
                      <option>Referral</option>
                      <option>Google</option>
                      <option>Facebook</option>
                      <option>Instagram</option>
                      <option>Repeat customer</option>
                      <option>Home show</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Project</h3>
                <div className="form-grid">
                  <label className="field">Project type
                    <select name="project_type" required defaultValue="">
                      <option value="" disabled>Select project</option>
                      {projectTypes.map((type) => <option key={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="field">Status
                    <select name="status" defaultValue="new">
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="appointment_set">Appointment set</option>
                      <option value="qualified">Qualified</option>
                    </select>
                  </label>
                  <label className="field">Assigned rep
                    <select name="assigned_to" defaultValue="me">
                      <option value="me">Assign to me</option>
                      <option value="">Unassigned</option>
                    </select>
                  </label>
                  <label className="field">Appointment
                    <input name="appointment" type="datetime-local" />
                  </label>
                </div>
                <label className="field">Notes<textarea name="notes" rows={3} placeholder="Scope, timing, budget, or anything the team should know" /></label>
              </div>

              <div className="form-section">
                <h3>Job site</h3>
                <div className="form-grid">
                  <label className="field form-span-2">Street address<input name="address_line1" required /></label>
                  <label className="field form-span-2">Unit / suite<input name="address_line2" /></label>
                  <label className="field">City<input name="city" required /></label>
                  <label className="field">State<input name="state" required maxLength={2} placeholder="IL" /></label>
                  <label className="field">ZIP code<input name="postal_code" required inputMode="numeric" /></label>
                </div>
              </div>

              {error && <p className="error" role="alert">{error}</p>}
              <div className="modal-actions">
                <button className="secondary" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
                <button className="primary button-auto" disabled={saving}>{saving ? 'Saving…' : 'Save lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
