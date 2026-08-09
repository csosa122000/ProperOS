import { UniversityManager } from '@/components/university-manager';
import { createClient } from '@/lib/supabase/server';

export default async function University(){
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(user)await supabase.rpc('claim_pending_memberships');const {data:orgs}=await supabase.rpc('get_my_organizations');const org=orgs?.[0];
  if(!user||!org)return <div className="card"><h1>Proper University</h1><p>Your workspace must be active.</p></div>;
  const {data:content}=await supabase.from('training_content').select('id,track,content_type,title,description,content_category,product_category,is_published,uploaded_file_name').eq('organization_id',org.organization_id).order('created_at',{ascending:false});
  return <><div className="top"><div><h1>Proper University</h1><p>Central training center for Sales, Canvassing, Telemarketing, Production, Marketing, HR, Safety, Product Training, tests, and certifications.</p></div></div><section className="module-grid"><div className="card"><h3>Canvassing</h3><p>Field training, pitch, appointment setting, product knowledge, policies, and reference material live here rather than on job boards.</p></div><div className="card"><h3>Sales & Telemarketing</h3><p>Presentations, scripts, product training, objection handling, testing, and certifications.</p></div><div className="card"><h3>Production & Safety</h3><p>Installation standards, quality procedures, safety, subcontractor training, and service processes.</p></div></section><div className="section"><UniversityManager organizationId={org.organization_id} userId={user.id} initialContent={(content||[]) as any}/></div></>;
}
