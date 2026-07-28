export default function Marketing(){
  return <>
    <div><h1>Marketing</h1><p>Track campaigns, lead sources, spend, and return.</p></div>
    <section className="grid section">
      <div className="card metric"><span>Marketing spend</span><strong>$0</strong></div>
      <div className="card metric"><span>Marketing leads</span><strong>0</strong></div>
      <div className="card metric"><span>Cost per lead</span><strong>$0</strong></div>
      <div className="card metric"><span>Revenue attributed</span><strong>$0</strong></div>
    </section>
    <section className="module-grid section">
      <div className="card"><h3>Campaigns</h3><p>Organize Google, Facebook, referral, and local campaigns.</p></div>
      <div className="card"><h3>Lead sources</h3><p>Compare lead volume, appointments, and closed revenue.</p></div>
      <div className="card"><h3>Creative library</h3><p>Keep approved ads, offers, photos, and messaging together.</p></div>
    </section>
  </>
}
