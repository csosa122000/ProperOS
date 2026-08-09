export default function Sales(){
  return <>
    <div><h1>Sales</h1><p>Track representative performance, appointments, close rates, pace, commissions, and sold revenue.</p></div>
    <section className="grid section">
      <div className="card metric"><span>Lifetime sales volume</span><strong>$0</strong></div>
      <div className="card metric"><span>Sales this month</span><strong>$0</strong></div>
      <div className="card metric"><span>Year-to-date volume</span><strong>$0</strong></div>
      <div className="card metric"><span>Expected commission</span><strong>$0</strong></div>
    </section>
    <section className="module-grid section">
      <div className="card"><h3>Representative Scorecard</h3><p>Sit rate, close rate, full-demo rate, average ticket, and progress to goal.</p></div>
      <div className="card"><h3>Sales Pipeline</h3><p>Open estimates, follow-up activity, expected commission, sold projects, and lost opportunities.</p></div>
      <div className="card"><h3>Leaderboard</h3><p>Lifetime volume and current-period production across the sales team.</p></div>
    </section>
  </>;
}
