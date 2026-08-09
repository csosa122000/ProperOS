import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json',
};
const COMPANY={name:'Proper Remodeling',phone:'(737) 217-9539',website:'properremodelingllc.com',address:'4175 Freidrich Ln, Suite 203, Austin, TX 78744'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
function outputText(payload:any){for(const item of payload?.output||[]){if(item?.type!=='message')continue;for(const part of item?.content||[])if(part?.type==='output_text'&&part?.text)return part.text;}return '';}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return reply({error:'Method not allowed.'},405);
  const auth=req.headers.get('Authorization');
  if(!auth)return reply({error:'Unauthorized.'},401);

  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError||!user)return reply({error:'Unauthorized.'},401);
  await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];
  if(!org)return reply({error:'Workspace is not active.'},403);

  let body:any={};
  try{body=await req.json();}catch{return reply({error:'Invalid request.'},400);}
  const estimateId=body?.estimateId as string|undefined;
  const proposalId=body?.proposalId as string|undefined;
  const revisionInstruction=String(body?.revisionInstruction||'').trim();
  if(!estimateId)return reply({error:'Estimate is required.'},400);

  const {data:estimate,error:estimateError}=await supabase.from('estimates').select('id,lead_id,estimate_number,project_name,title,project_address,category_slug,ninety_day_price,today_price,notes').eq('organization_id',org.organization_id).eq('id',estimateId).single();
  if(estimateError||!estimate)return reply({error:'Estimate not found.'},404);
  const [{data:items},{data:lead}]=await Promise.all([
    supabase.from('estimate_items').select('name,unit,quantity,included_allowance_rate,allowance_mode').eq('estimate_id',estimate.id).order('created_at'),
    estimate.lead_id?supabase.from('leads').select('first_name,last_name,email,phone').eq('id',estimate.lead_id).single():Promise.resolve({data:null} as any),
  ]);
  let existingProposal:any=null;
  if(proposalId){
    const {data}=await supabase.from('customer_proposals').select('id,status,proposal_number,proposal_content').eq('organization_id',org.organization_id).eq('id',proposalId).eq('estimate_id',estimate.id).single();
    if(!data)return reply({error:'Proposal not found.'},404);
    if(data.status!=='draft')return reply({error:'Only draft proposals can be regenerated.'},409);
    existingProposal=data;
  }

  const customerName=lead?`${lead.first_name||''} ${lead.last_name||''}`.trim():'Customer';
  const prompt={company:COMPANY,customer:{name:customerName,email:lead?.email||null,phone:lead?.phone||null,address:estimate.project_address},project:{name:estimate.project_name||estimate.title,category:estimate.category_slug,notes:estimate.notes||null},scope:(items||[]).map((i:any)=>({work_item:i.name,quantity:Number(i.quantity),unit:i.unit,allowance_rate:i.included_allowance_rate==null?null:Number(i.included_allowance_rate),allowance_mode:i.allowance_mode})),pricing:{ninety_day:Number(estimate.ninety_day_price),today:Number(estimate.today_price)},revision_instruction:revisionInstruction||null,previous_copy:existingProposal?.proposal_content?.ai||null};

  const apiKey=Deno.env.get('OPENAI_API_KEY');
  if(!apiKey)return reply({error:'AI Proposal Designer is deployed, but the OPENAI_API_KEY Supabase secret has not been configured yet.'},503);
  const schema={type:'object',additionalProperties:false,properties:{headline:{type:'string'},project_subtitle:{type:'string'},introduction:{type:'string'},scope_title:{type:'string'},scope_summary:{type:'string'},scope_bullets:{type:'array',items:{type:'string'}},benefits:{type:'array',items:{type:'string'}},allowance_notes:{type:'array',items:{type:'string'}},warranty_summary:{type:'string'},investment_label:{type:'string'},closing:{type:'string'}},required:['headline','project_subtitle','introduction','scope_title','scope_summary','scope_bullets','benefits','allowance_notes','warranty_summary','investment_label','closing']};
  const ai=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:Deno.env.get('OPENAI_PROPOSAL_MODEL')||'gpt-5',instructions:'You create concise, polished customer-facing remodeling proposal copy for Proper Remodeling. Never change, calculate, invent, round, discount, or reinterpret any supplied price. Never invent company contact information, warranties, products, measurements, allowances, financing, or work not present in the supplied data. Do not expose internal pricing, markup, miscellaneous fees, commissions, or cost mechanics. Translate estimator line items into clear professional scope language. Allowance notes must state only supplied included allowance rates and never present them as cash credits. If revision_instruction is supplied, revise only presentation copy while preserving all facts. Return only the requested structured content.',input:JSON.stringify(prompt),text:{format:{type:'json_schema',name:'proper_proposal',strict:true,schema}}})});
  const raw=await ai.json();
  if(!ai.ok)return reply({error:raw?.error?.message||'AI proposal generation failed.'},502);
  let generated:any;
  try{generated=JSON.parse(outputText(raw));}catch{return reply({error:'AI returned an invalid proposal response.'},502);}

  const proposalContent={brand:COMPANY,layout:'brochure_ai_one_project',estimate_number:estimate.estimate_number,customer:{name:customerName,email:lead?.email||null,phone:lead?.phone||null},project:{name:estimate.project_name||estimate.title,address:estimate.project_address,category:estimate.category_slug},pricing:{ninety_day:Number(estimate.ninety_day_price),today:Number(estimate.today_price)},ai:generated,workflow:{accepted_creates_contract:true}};
  const number=existingProposal?.proposal_number||`PRP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const proposalPayload={scope_summary:generated.scope_summary,proposal_content:proposalContent,updated_by:user.id};
  let proposal:any,error:any;
  if(existingProposal){({data:proposal,error}=await supabase.from('customer_proposals').update(proposalPayload).eq('id',existingProposal.id).select('id,estimate_id,proposal_number,title,status,scope_summary,proposal_content,accepted_by_name,accepted_at,created_at').single());}
  else{({data:proposal,error}=await supabase.from('customer_proposals').insert({organization_id:org.organization_id,estimate_id:estimate.id,proposal_number:number,template_name:'Proper Remodeling AI Brochure Proposal',title:estimate.project_name||estimate.title,...proposalPayload,status:'draft',created_by:user.id}).select('id,estimate_id,proposal_number,title,status,scope_summary,proposal_content,accepted_by_name,accepted_at,created_at').single());}
  if(error)return reply({error:error.message},400);

  await supabase.from('ai_workflow_runs').insert({organization_id:org.organization_id,created_by:user.id,workflow_type:'proposal',title:`${existingProposal?'Revised':'Generated'} ${number}`,request_text:revisionInstruction||'Generate customer-facing proposal from locked estimate.',draft_text:JSON.stringify(generated),source_context:{estimate_id:estimate.id,proposal_id:proposal.id,locked_pricing:{ninety_day:Number(estimate.ninety_day_price),today:Number(estimate.today_price)}},status:'completed',risk_level:'financial'});
  return reply({proposal});
});
