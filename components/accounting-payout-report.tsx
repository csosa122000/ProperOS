'use client';

import {useMemo,useState} from 'react';

export type PayoutRow={
  id:string;
  paid_at:string;
  payee_name:string;
  amount:number;
  payment_method:string;
  payment_category:string;
  customer_name?:string|null;
  job_number?:string|null;
  contract_number?:string|null;
  memo?:string|null;
  recorded_by?:string|null;
  approved_by?:string|null;
};

type Props={rows:PayoutRow[];liveDataConnected:boolean};

type Preset='this_month'|'last_month'|'ytd'|'custom';

const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));
const shortDate=(value:string)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric'}).format(new Date(value));
const isoDate=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function datesForPreset(preset:Preset){
  const now=new Date();
  if(preset==='this_month')return {from:isoDate(new Date(now.getFullYear(),now.getMonth(),1)),to:isoDate(now)};
  if(preset==='last_month')return {from:isoDate(new Date(now.getFullYear(),now.getMonth()-1,1)),to:isoDate(new Date(now.getFullYear(),now.getMonth(),0))};
  if(preset==='ytd')return {from:`${now.getFullYear()}-01-01`,to:isoDate(now)};
  return {from:isoDate(new Date(now.getFullYear(),now.getMonth(),1)),to:isoDate(now)};
}

export function AccountingPayoutReport({rows,liveDataConnected}:Props){
  const initial=datesForPreset('this_month');
  const [preset,setPreset]=useState<Preset>('this_month');
  const [from,setFrom]=useState(initial.from);
  const [to,setTo]=useState(initial.to);
  const [category,setCategory]=useState('all');
  const [method,setMethod]=useState('all');
  const [payee,setPayee]=useState('');
  const [job,setJob]=useState('');

  const categories=useMemo(()=>Array.from(new Set(rows.map(r=>r.payment_category).filter(Boolean))).sort(),[rows]);
  const methods=useMemo(()=>Array.from(new Set(rows.map(r=>r.payment_method).filter(Boolean))).sort(),[rows]);

  const filtered=useMemo(()=>rows.filter(r=>{
    const d=r.paid_at.slice(0,10);
    if(from&&d<from)return false;
    if(to&&d>to)return false;
    if(category!=='all'&&r.payment_category!==category)return false;
    if(method!=='all'&&r.payment_method!==method)return false;
    if(payee&&!r.payee_name.toLowerCase().includes(payee.toLowerCase()))return false;
    const jobText=[r.customer_name,r.job_number,r.contract_number].filter(Boolean).join(' ').toLowerCase();
    if(job&&!jobText.includes(job.toLowerCase()))return false;
    return true;
  }),[rows,from,to,category,method,payee,job]);

  const total=filtered.reduce((s,r)=>s+Number(r.amount||0),0);
  const byCategory=Object.entries(filtered.reduce((acc,r)=>{acc[r.payment_category]=(acc[r.payment_category]||0)+Number(r.amount||0);return acc;},{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]);
  const byMethod=Object.entries(filtered.reduce((acc,r)=>{acc[r.payment_method]=(acc[r.payment_method]||0)+Number(r.amount||0);return acc;},{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]);

  function applyPreset(next:Preset){setPreset(next);if(next!=='custom'){const range=datesForPreset(next);setFrom(range.from);setTo(range.to);}}
  function csvEscape(value:unknown){const s=String(value??'');return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
  function exportCsv(){
    const header=['Payment Date','Paid To','Amount','Payment Method','Payment Category','Customer / Job','Contract / Job Number','Memo','Recorded By','Approved By'];
    const body=filtered.map(r=>[shortDate(r.paid_at),r.payee_name,r.amount.toFixed(2),r.payment_method,r.payment_category,r.customer_name||'',r.contract_number||r.job_number||'',r.memo||'',r.recorded_by||'',r.approved_by||'']);
    const csv=[header,...body].map(row=>row.map(csvEscape).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`proper-os-payout-report-${from}-to-${to}.csv`;a.click();URL.revokeObjectURL(url);
  }

  return <section className="card section payout-report">
    <div className="top"><div><h2>Accounting Payout Report</h2><p>Review everything Proper Remodeling paid out for a month or any custom date range.</p></div><div className="actions"><button type="button" className="secondary" onClick={()=>window.print()}>Print Report</button><button type="button" onClick={exportCsv} disabled={!filtered.length}>Export CSV</button></div></div>

    {!liveDataConnected&&<div className="card" style={{borderStyle:'dashed',marginTop:16}}><strong>Report interface ready — live payout connection pending.</strong><p>The filters, totals, print layout and CSV export are built. Proper OS will populate this report from the live payout/job-cost ledger as soon as the Supabase connector is available again.</p></div>}

    <div className="module-grid section">
      <label className="card"><span>Report Period</span><select value={preset} onChange={e=>applyPreset(e.target.value as Preset)}><option value="this_month">This Month</option><option value="last_month">Last Month</option><option value="ytd">Year to Date</option><option value="custom">Custom Date Range</option></select></label>
      <label className="card"><span>From</span><input type="date" value={from} onChange={e=>{setPreset('custom');setFrom(e.target.value)}}/></label>
      <label className="card"><span>To</span><input type="date" value={to} onChange={e=>{setPreset('custom');setTo(e.target.value)}}/></label>
      <div className="card metric"><span>Total Paid</span><strong>{money(total)}</strong><small>{filtered.length} payment{filtered.length===1?'':'s'} in selected period</small></div>
    </div>

    <div className="module-grid section">
      <label className="card"><span>Payment Category</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All Categories</option>{categories.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
      <label className="card"><span>Payment Method</span><select value={method} onChange={e=>setMethod(e.target.value)}><option value="all">All Methods</option>{methods.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
      <label className="card"><span>Paid To</span><input value={payee} onChange={e=>setPayee(e.target.value)} placeholder="Person, subcontractor or vendor"/></label>
      <label className="card"><span>Customer / Job</span><input value={job} onChange={e=>setJob(e.target.value)} placeholder="Customer, contract or job #"/></label>
    </div>

    <div className="section" style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Date</th><th>Paid To</th><th>Amount</th><th>Method</th><th>Category</th><th>Customer / Job</th><th>Contract / Job #</th><th>Memo</th><th>Recorded By</th><th>Approved By</th></tr></thead><tbody>{filtered.length?filtered.map(r=><tr key={r.id}><td>{shortDate(r.paid_at)}</td><td><strong>{r.payee_name}</strong></td><td>{money(r.amount)}</td><td>{r.payment_method}</td><td>{r.payment_category}</td><td>{r.customer_name||'—'}</td><td>{r.contract_number||r.job_number||'—'}</td><td>{r.memo||'—'}</td><td>{r.recorded_by||'—'}</td><td>{r.approved_by||'—'}</td></tr>):<tr><td colSpan={10}>No payout records match the selected report filters.</td></tr>}</tbody></table></div>

    <div className="module-grid section">
      <div className="card"><h3>Totals by Payment Category</h3>{byCategory.length?byCategory.map(([name,amount])=><p key={name}><strong>{name}</strong><br/>{money(amount)}</p>):<p>No category totals for this period.</p>}</div>
      <div className="card"><h3>Totals by Payment Method</h3>{byMethod.length?byMethod.map(([name,amount])=><p key={name}><strong>{name}</strong><br/>{money(amount)}</p>):<p>No payment-method totals for this period.</p>}</div>
      <div className="card"><h3>Included Payment Types</h3><p>Subcontractors · Materials · Commissions · Payroll · Refunds · Marketing · Permits/Fees · Miscellaneous Job Costs</p></div>
    </div>
  </section>;
}
