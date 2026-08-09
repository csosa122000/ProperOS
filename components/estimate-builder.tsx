'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Category={id:string;name:string;slug:string;miscellaneous_fee:number;markup_rate:number;today_discount_rate:number};
type Item={id:string;category_id:string;product_name:string;option_name:string;name:string;sku:string;unit:string;base_unit_price:number;included_allowance_rate:number|null;allowance_mode:string};
type QtyMap=Record<string,number>;

function tierMatch(items:Item[],qty:number){
  if(items.length===1)return items[0];
  const under=items.find(i=>/under 20|up to 200/i.test(i.name));
  const mid=items.find(i=>/20[–-]29/i.test(i.name));
  const high=items.find(i=>/30\+/i.test(i.name));
  if(under&&mid&&high){if(qty<20)return under;if(qty<30)return mid;return high;}
  const under200=items.find(i=>/under 200|up to 200/i.test(i.name));
  const over200=items.find(i=>/201\+/i.test(i.name));
  if(under200&&over200)return qty<=200?under200:over200;
  return items[0];
}

export function EstimateBuilder({categories,items,organizationId,userId}:{categories:Category[];items:Item[];organizationId:string;userId:string}){
  const [categoryId,setCategoryId]=useState(categories[0]?.id||'');
  const [qty,setQty]=useState<QtyMap>({});
  const [title,setTitle]=useState('');
  const [address,setAddress]=useState('');
  const [message,setMessage]=useState('');
  const [saving,setSaving]=useState(false);
  const category=categories.find(c=>c.id===categoryId);
  const groups=useMemo(()=>{
    const map=new Map<string,Item[]>();
    items.filter(i=>i.category_id===categoryId).forEach(i=>{const key=i.product_name||i.name;map.set(key,[...(map.get(key)||[]),i]);});
    return [...map.entries()].map(([product,options])=>({product,options}));
  },[items,categoryId]);
  const selected=groups.map(g=>{const q=Number(qty[g.product]||0);const item=tierMatch(g.options,q);return {q,item,product:g.product,line:q*Number(item?.base_unit_price||0)};}).filter(x=>x.q>0&&x.item);
  const base=selected.reduce((s,x)=>s+x.line,0);
  const misc=base>0?Number(category?.miscellaneous_fee||0):0;
  const ninety=(base+misc)*(1+Number(category?.markup_rate||0));
  const today=ninety*(1-Number(category?.today_discount_rate||0));
  const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);

  async function save(){
    if(!category||!selected.length){setMessage('Add at least one priced item first.');return;}
    setSaving(true);setMessage('');const supabase=createClient();
    const {data:estimate,error}=await supabase.from('estimates').insert({organization_id:organizationId,title:title||`${category.name} Project`,project_name:title||`${category.name} Project`,project_address:address||null,category_slug:category.slug,status:'draft',base_subtotal:base,miscellaneous_fee:misc,markup_rate:category.markup_rate,today_discount_rate:category.today_discount_rate,ninety_day_price:ninety,today_price:today,created_by:userId}).select('id,estimate_number').single();
    if(error){setMessage(error.message);setSaving(false);return;}
    const rows=selected.map(x=>({estimate_id:estimate.id,organization_id:organizationId,pricing_item_id:x.item.id,sku:x.item.sku,name:x.item.name,unit:x.item.unit,quantity:x.q,unit_price:x.item.base_unit_price,line_total:x.line,allowance_mode:x.item.allowance_mode,included_allowance_rate:x.item.included_allowance_rate}));
    const {error:itemError}=await supabase.from('estimate_items').insert(rows);
    if(itemError){setMessage(`Estimate saved, but line items failed: ${itemError.message}`);setSaving(false);return;}
    setMessage(`Estimate ${estimate.estimate_number||''} saved. Open Proposals to generate the Proper Remodeling proposal.`);setSaving(false);
  }

  return <>
    <div className="card">
      <div className="form-grid">
        <label className="field">Project name<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Customer / project"/></label>
        <label className="field">Project address<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Job address"/></label>
        <label className="field">Project category<select value={categoryId} onChange={e=>{setCategoryId(e.target.value);setQty({});}}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      <div className="section">
        <h2>{category?.name} pricing</h2>
        <p>Like products are grouped together. Quantity automatically selects the correct volume tier, so Siding and other tiered categories do not show duplicate pricing choices.</p>
        <table className="table"><thead><tr><th>Product</th><th>Quantity</th><th>Unit</th><th>Applied price</th><th>Line total</th></tr></thead><tbody>{groups.map(g=>{const q=Number(qty[g.product]||0);const item=tierMatch(g.options,q);return <tr key={g.product}><td><strong>{g.product}</strong>{g.options.length>1&&<div><small>Auto-tiered by quantity</small></div>}</td><td><input style={{width:100}} type="number" min="0" step="1" value={qty[g.product]||''} onChange={e=>setQty({...qty,[g.product]:Number(e.target.value)})}/></td><td>{String(item?.unit||'').replaceAll('_',' ')}</td><td>{money(Number(item?.base_unit_price||0))}</td><td>{money(q*Number(item?.base_unit_price||0))}</td></tr>})}</tbody></table>
      </div>
    </div>
    <section className="grid section"><div className="card metric"><span>Base subtotal</span><strong>{money(base)}</strong></div><div className="card metric"><span>Category misc.</span><strong>{money(misc)}</strong></div><div className="card metric"><span>90-day price</span><strong>{money(ninety)}</strong></div><div className="card metric"><span>Today price</span><strong>{money(today)}</strong></div></section>
    <div className="card section"><h3>Proper pricing workflow</h3><p>Master/base pricing + category miscellaneous fee → 25% markup → 90-day contract price → 15% Today discount. Pricing option #3 is removed; standard pricing is the default.</p>{message&&<p>{message}</p>}<button className="primary button-auto" onClick={save} disabled={saving||!selected.length}>{saving?'Saving…':'Save Estimate & Continue to Proposal'}</button></div>
  </>;
}
