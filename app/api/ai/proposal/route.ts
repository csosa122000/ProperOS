import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const COMPANY={name:'Proper Remodeling',phone:'(737) 217-9539',website:'properremodelingllc.com',address:'4175 Freidrich Ln, Suite 203, Austin, TX 78744'};

function outputText(payload:any){for(const item of payload?.output||[]){if(item?.type!=='message')continue;for(const part of item?.content||[])if(part?.type==='output_text'&&part?.text)return part.text;}return '';}

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];
  if(!org)return NextResponse.json({error:'Workspace is not active.'},{status:403});

  const body=await request.json();
  const estimateId=String(body?.estimateId||'');
  const proposalId=body?.proposalId?String(body.proposalId):null;
  const direction=String(body?.direction||'').trim().slice(0,1200);
  if(!estimateId)return NextResponse.json({error:'Estimate is required.'},{status:400});

  const {data:estimate,error:estimateError}=await supabase.from('estimates').select('id,lead_id,estimate_number,project_name,title,project_address,category_slug,ninety_day_price,today_price,notes').eq('organization_id',org.organization_id).eq('id',estimateId).single();
  if(estimateError||!estimate)return NextResponse.json({error:'Estimate not found.'},{status:404});
  let existing:any=null;
  if(proposalId){const result=await supabase.from('customer_proposals').select('id,proposal_number,status,estimate_id').eq('organization_id',org.organization_id).eq('id',proposalId).single();existing=result.data;if(result.error||!existing||existing.estimate_id!==estimate.id)return NextResponse.json({error:'Proposal not found.'},{status:404});if(existing.status!=='draft')return NextResponse.json({error:'Only draft proposals can be regenerated.'},{status:400});}

  const [{data:items},{data:lead}]=await Promise.all([
    supabase.from('estimate_items').select('name,unit,quantity,included_allowance_rate,allowance_mode').eq('estimate_id',estimate.id).order('created_at'),
    estimate.lead_id?supabase.from('leads').select('first_name,last_name,email,phone').eq('id',estimate.lead_id).single():Promise.resolve({data:null} as any),
  ]);
  const customerName=lead?`${lead.first_name||''} ${lead.last_name||''}`.trim():'Customer';
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey)return NextResponse.json({error:'AI Proposal Designer is ready, but OPENAI_API_KEY is not configured in the hosting environment.'},{status:503});

  const prompt={company:COMPANY,customer:{name:customerName,email:lead?.email||null,phone:lead?.phone||null,address:estimate.project_address},project:{name:estimate.project_name||estimate.title,category:estimate.category_slug,notes:estimate.notes||null},scope:(items||[]).map((i:any)=>({work_item:i.name,quantity:Number(i.quantity),unit:i.unit,allowance_rate:i.included_allowance_rate==null?null:Number(i.included_allowance_rate),allowance_mode:i.allowance_mode})),pricing:{ninety_day:Number(estimate.ninety_day_price),today:Number(estimate.today_price)},revision_direction:direction||null};
  const {data:run}=await supabase.from('ai_workflow_runs').insert({organization_id:org.organization_id,created_by:user.id,workflow_type:'proposal',title:`AI proposal — ${estimate.project_name||estimate.title}`,request_text:direction||'Generate customer-facing proposal from approved estimate.',source_context:{estimate_id:estimate.id,proposal_id:proposalId,estimate_number:estimate.estimate_number,pricing_locked:true},status:'draft',risk_level:'financial'}).select('id').single();
  const schema={type:'object',additionalProperties:false,properties:{headline:{type:'string'},project_subtitle:{type:'string'},introduction:{type:'string'},scope_title:{type:'string'},scope_summary:{type:'string'},scope_bullets:{type:'array',items:{type:'string'}},benefits:{type:'array',items:{type:'string'}},allowance_notes:{type:'array',items:{type:'string'}},warranty_summary:{type:'string'},investment_label:{type:'string'},closing:{type:'string'}},required:['headline','project_subtitle','introduction','scope_title','scope_summary','scope_bullets','benefits','allowance_notes','warranty_summary','investment_label','closing']};
  const ai=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_PROPOSAL_MODEL||'gpt-5',instructions:'You create concise, polished customer-facing remodeling proposal copy for Proper Remodeling. Never change, calculate, invent, round, discount, or reinterpret any supplied price. Never invent company contact information, warranties, products, measurements, allowances, financing, or work not present in the supplied data. Do not expose internal pricing, markup, miscellaneous fees, commissions, or cost mechanics. Translate estimator line items into clear professional scope language. Allowance notes must state only supplied included allowance rates and never present them as cash credits. Revision direction may change wording/layout emphasis only; it cannot override these factual constraints. Return only the requested structured content.',input:JSON.stringify(prompt),text:{format:{type:'json_schema',name:'proper_proposal',strict:true,schema}}})});
  const raw=await ai.json();
  if(!ai.ok){if(run?.id)await supabase.from('ai_workflow_runs').update({status:'rejected',review_notes:raw?.error?.message||'AI request failed.'}).eq('id',run.id);return NextResponse.json({error:raw?.error?.message||'AI proposal generation failed.'},{status:502});}
  const text=outputText(raw);let generated:any;
  try{generated=JSON.parse(text);}catch{if(run?.id)await supabase.from('ai_workflow_runs').update({status:'rejected',review_notes:'Invalid structured AI response.'}).eq('id',run.id);return NextResponse.json({error:'AI returned an invalid proposal response.'},{status:502});}
  const number=existing?.proposal_number||`PRP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const proposalContent={brand:COMPANY,layout:'brochure_ai_one_project',estimate_number:estimate.estimate_number,customer:{name:customerName,email:lead?.email||null,phone:lead?.phone||null},project:{name:estimate.project_name||estimate.title,address:estimate.project_address,category:estimate.category_slug},pricing:{ninety_day:Number(estimate.ninety_day_price),today:Number(estimate.today_price)},ai:generated,workflow:{accepted_creates_contract:true},ai_run_id:run?.id||null};
  let proposalResult:any;
  if(existing){proposalResult=await supabase.from('customer_proposals').update({scope_summary:generated.scope_summary,proposal_content:proposalContent,updated_by:user.id}).eq('id',existing.id).select('id,estimate_id,proposal_number,title,status,scope_summary,proposal_content,accepted_by_name,accepted_at,created_at').single();}
  else{proposalResult=await supabase.from('customer_proposals').insert({organization_id:org.organization_id,estimate_id:estimate.id,proposal_number:number,template_name:'Proper Remodeling AI Brochure Proposal',title:estimate.project_name||estimate.title,scope_summary:generated.scope_summary,proposal_content:proposalContent,status:'draft',created_by:user.id}).select('id,estimate_id,proposal_number,title,status,scope_summary,proposal_content,accepted_by_name,accepted_at,created_at').single();}
  if(proposalResult.error){if(run?.id)await supabase.from('ai_workflow_runs').update({status:'rejected',review_notes:proposalResult.error.message}).eq('id',run.id);return NextResponse.json({error:proposalResult.error.message},{status:400});}
  if(run?.id)await supabase.from('ai_workflow_runs').update({status:'completed',draft_text:JSON.stringify(generated),source_context:{estimate_id:estimate.id,proposal_id:proposalResult.data.id,estimate_number:estimate.estimate_number,pricing_locked:true}}).eq('id',run.id);
  return NextResponse.json({proposal:proposalResult.data});
}
