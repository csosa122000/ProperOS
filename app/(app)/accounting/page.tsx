export default function Accounting(){
  return <>
    <div><h1>Accounting</h1><p>Owner and accounting access for receivables, payments, commissions, and profitability.</p></div>
    <section className="grid section">
      <div className="card metric"><span>Accounts receivable</span><strong>$0</strong></div>
      <div className="card metric"><span>Collected this month</span><strong>$0</strong></div>
      <div className="card metric"><span>Outstanding commissions</span><strong>$0</strong></div>
      <div className="card metric"><span>Gross profit</span><strong>$0</strong></div>
    </section>
    <section className="module-grid section">
      <div className="card"><h3>Customer payments</h3><p>Track deposits, progress payments, balances, and collections.</p></div>
      <div className="card"><h3>Sales commissions</h3><p>Calculate rep commissions using Proper Remodeling rules.</p></div>
      <div className="card"><h3>QuickBooks</h3><p>Accounting synchronization and reconciliation will live here.</p></div>
    </section>
  </>
}
