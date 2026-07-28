import { NewLeadForm } from '@/components/new-lead-form';
import { createClient } from '@/lib/supabase/server';

type Lead = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string;
  project_interest: string[] | null;
  created_at: string;
};

export default async function CRM() {
  const supabase = await createClient();
  const [{ data: { user } }, { data: orgs }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc('get_my_organizations'),
  ]);
  const org = orgs?.[0];
  const { data: leads } = org
    ? await supabase
        .from('leads')
        .select('id,first_name,last_name,phone,email,source,status,project_interest,created_at')
        .eq('organization_id', org.organization_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    : { data: [] };

  if (!org || !user) {
    return (
      <div className="card empty-state">
        <h1>Finish workspace setup</h1>
        <p>Your company invitation has not been activated. Sign out and sign in again to connect your Proper Remodeling workspace.</p>
      </div>
    );
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>CRM</h1>
          <p>Capture new opportunities and keep the sales pipeline moving.</p>
        </div>
        <NewLeadForm
          organizationId={org.organization_id}
          branchId={org.default_branch_id}
          currentUserId={user.id}
        />
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Contact</th><th>Project</th><th>Source</th><th>Status</th><th>Added</th></tr></thead>
          <tbody>
            {leads?.length ? (leads as Lead[]).map((lead) => (
              <tr key={lead.id}>
                <td><strong>{lead.first_name} {lead.last_name}</strong></td>
                <td>{lead.phone || lead.email || '—'}</td>
                <td>{lead.project_interest?.join(', ') || '—'}</td>
                <td>{lead.source || '—'}</td>
                <td><span className="pill">{lead.status.replaceAll('_', ' ')}</span></td>
                <td>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(lead.created_at))}</td>
              </tr>
            )) : <tr><td colSpan={6} className="empty-cell">No leads yet. Add your first opportunity to get started.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
