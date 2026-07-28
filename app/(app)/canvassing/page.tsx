import Link from 'next/link';

export default function Canvassing(){
  return <>
    <div className="top"><div><h1>Canvassing</h1><p>Manage field activity, territories, conversations, and canvasser performance.</p></div><Link className="primary button-auto link-button" href="/crm">Add canvassing lead</Link></div>
    <section className="grid">
      <div className="card metric"><span>Doors knocked today</span><strong>0</strong></div>
      <div className="card metric"><span>Conversations</span><strong>0</strong></div>
      <div className="card metric"><span>Leads created</span><strong>0</strong></div>
      <div className="card metric"><span>Appointments set</span><strong>0</strong></div>
    </section>
    <section className="module-grid section">
      <div className="card"><h3>Territories</h3><p>Assign neighborhoods and track field coverage.</p></div>
      <div className="card"><h3>Team activity</h3><p>See canvasser check-ins, contacts, and results.</p></div>
      <div className="card"><h3>Live chat</h3><p>Keep canvassers and management connected in the field.</p></div>
    </section>
  </>
}
