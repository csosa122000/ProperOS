import { EstimateBuilder } from '@/components/estimate-builder';
import { createClient } from '@/lib/supabase/server';

export default async function Estimates(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(user) await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];
  if(!user||!org)return <div className="card"><h1>Estimate Builder</h1><p>Your Proper OS workspace must be active before estimates can be created.</p></div>;
  const {data:categories}=await supabase.from('pricing_categories').select('id,name,slug,miscellaneous_fee,markup_rate,today_discount_rate').eq('is_active',true).order('sort_order');
  const {data:items}=await supabase.from('pricing_items').select('id,category_id,product_name,option_name,name,sku,unit,base_unit_price,included_allowance_rate,allowance_mode').eq('is_active',true).order('product_name').order('name');
  const normalizedCategories=(categories||[]).map((c:any)=>({...c,miscellaneous_fee:Number(c.miscellaneous_fee),markup_rate:Number(c.markup_rate),today_discount_rate:Number(c.today_discount_rate)}));
  const normalizedItems=(items||[]).map((i:any)=>({...i,base_unit_price:Number(i.base_unit_price),included_allowance_rate:i.included_allowance_rate==null?null:Number(i.included_allowance_rate)}));
  return <><div className="top"><div><h1>Estimate Builder</h1><p>Build projects directly from the Proper Remodeling master pricing book.</p></div></div><EstimateBuilder categories={normalizedCategories} items={normalizedItems} organizationId={org.organization_id} userId={user.id}/></>;
}
