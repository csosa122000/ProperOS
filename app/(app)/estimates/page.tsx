import { EstimateBuilder } from '@/components/estimate-builder';
import { createClient } from '@/lib/supabase/server';

export default async function Estimates(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user) await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];
  if(!user||!org)return <div className="card"><h1>Estimator</h1><p>Your Proper OS workspace must be active before estimates can be created.</p></div>;
  const [{data:categories},{data:items},{data:leadRows},{data:propertyRows}]=await Promise.all([
    supabase.from('pricing_categories').select('id,name,slug,miscellaneous_fee,markup_rate,today_discount_rate').eq('is_active',true).order('sort_order'),
    supabase.from('pricing_items').select('id,category_id,product_name,option_name,name,sku,unit,base_unit_price,included_allowance_rate,allowance_mode').eq('is_active',true).order('product_name').order('name'),
    supabase.from('leads').select('id,customer_id,first_name,last_name,email,phone,status,project_interest').eq('organization_id',org.organization_id).is('deleted_at',null).order('created_at',{ascending:false}).limit(250),
    supabase.from('properties').select('lead_id,address_line1,address_line2,city,state,postal_code,is_primary').eq('organization_id',org.organization_id).is('deleted_at',null),
  ]);
  const normalizedCategories=(categories||[]).map((c:any)=>({...c,miscellaneous_fee:Number(c.miscellaneous_fee),markup_rate:Number(c.markup_rate),today_discount_rate:Number(c.today_discount_rate)}));
  const normalizedItems=(items||[]).map((i:any)=>({...i,base_unit_price:Number(i.base_unit_price),included_allowance_rate:i.included_allowance_rate==null?null:Number(i.included_allowance_rate)}));
  const addressByLead=new Map<string,string>();
  for(const p of (propertyRows||[]) as any[]){if(!p.lead_id||(!p.is_primary&&addressByLead.has(p.lead_id)))continue;addressByLead.set(p.lead_id,[p.address_line1,p.address_line2,p.city,p.state,p.postal_code].filter(Boolean).join(', '));}
  const leads=(leadRows||[]).map((l:any)=>({id:l.id,customer_id:l.customer_id,first_name:l.first_name,last_name:l.last_name,email:l.email,phone:l.phone,status:l.status,project_interest:l.project_interest||[],address:addressByLead.get(l.id)||''}));
  return <><div className="top"><div><h1>Estimator</h1><p>Guided project pricing powered by the Proper Remodeling master pricing book. Build the scope here, approve the internal price, then let the AI Proposal Designer create the customer presentation.</p></div></div><EstimateBuilder categories={normalizedCategories} items={normalizedItems} leads={leads} organizationId={org.organization_id} userId={user.id}/></>;
}
