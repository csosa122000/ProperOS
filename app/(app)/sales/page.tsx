export default function Sales(){
  return <>
    <div><h1>Sales Production</h1><p>Track representative performance, appointments, close rates, pace, and sold revenue.</p></div>
    <section className="grid section">
      <div className="card metric"><span>Sales this month</span><strong>$0</strong></div>
      <div className="card metric"><span>Appointments run</span><strong>0</strong></div>
      <div className="card metric"><span>Close rate</span><strong>0%</strong></div>
      <div className="card metric"><span>Monthly pace</span><strong>$0</strong></div>
    </section>
    <section className="module-grid section">
      <div className="card"><h3>Representative Scorecards</h3><p>Monthly totals, sit rate, close rate, average ticket, and progress to goal.</p></div>
      <div className="card"><h3>Company Performance</h3><p>Company totals, year-to-date production, trends, and leaderboard reporting.</p></div>
      <div className="card"><h3>Quote Tracking</h3><p>Open estimates, follow-up activity, sold projects, and lost opportunities.</p></div>
    </section>
  </>
}