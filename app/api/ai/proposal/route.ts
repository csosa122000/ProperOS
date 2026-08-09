import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const COMPANY={name:'Proper Remodeling',phone:'(737) 217-9539',website:'properremodelingllc.com',address:'4175 Freidrich Ln, Suite 203, Austin, TX 78744'};

function outputText(payload:any){
  for(const item of payload?.output||[]){
    if(item?.type!=='message')continue;
    for(const part of item?.content||[])if(part?.type==='output_text'&&part?.text)return part.text;
  }
  return '';
}

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  await supabase.rpc('claim_pending_memberships');
  const {data:orgs}=await supabase.rpc('get_my_organizations');
  const org=orgs?.[0];
  if(!org)return NextResponse.json({error:'Workspace is not active.'},{status:403});

  const {estimateId}=await request.json();
  if(!estimateId)return NextResponse.json({error:'Estimate is required.'},{status:400});
  const {data:estimate,error:estimateError}=await supabase.from('estimates').select('id,lead_id,estimate_number,project_name,title,project_address,category_slug,ninety_day_price,today_price,notes').eq('organization_id',org.organization_id).eq('id',estimateId).single();
  if(estimateError||!estimate)return NextResponse.json({error:'Estimate not found.'},{status:404});
  const [{data:items},{data:lead}]=await Promise.all([
    supabase.from('estimate_items').select('name,unit,quantity,included_allowance_rate,allowance_mode').eq('estimate_id',estimate.id).order('created_at'),
    estimate.lead_id?supabase.from('leads').select('first_name,last_name,email,phone').eq('id',estimate.lead_id).single():Promise.resolve({data:null} as any),
  ]);
  const customerName=lead?`${lead.first_name||''} ${lead.last_name||''}`.trim():'Customer';
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey)return NextResponse.json({error:'AI Proposal Designer is ready, but OPENAI_API_KEY is not configured in the hosting environment.'},{status:503});

  const prompt={
    company:COMPANY,
    customer:{name:customerName,email:lead?.email||null,phone:lead?.phone||null,address:estimate.project_address},
    project:{name:estimate.project_name||estimate.title,category:estimate.category_slug,notes:estimate.notes||null},
    scope:(items||[]).map((i:any)=>({work_item:i.name,quantity:Number(i.quantity),unit:i.unit,allowance_rate:i.included_allowance_rate==null?null:Number(i.included_allowance_rate),allowance_mode:i.allowance_mode})),
    pricing:{ninety_day:Number(estimate.ninety_day_price),today:Number(estimate.today_price)},
  };
  const schema={type:'object',additionalProperties:false,properties:{headline:{type:'string'},project_subtitle:{type:'string'},introduction:{type:'string'},scope_title:{type:'string'},scope_summary:{type:'string'},scope_bullets:{type:'array',items:{type:'string'}},benefits:{type:'array',items:{type:'string'}},allowance_notes:{type:'array',items:{type:'string'}},warranty_summary:{type:'string'},investment_label:{type:'string'},closing:{type:'string'}},required:['headline','project_subtitle','introduction','scope_title','scope_summary','scope_bullets','benefits','allowance_notes','warranty_summary','investment_label','closing']};
  const ai=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_PROPOSAL_MODEL||'gpt-5',instructions:'You create concise, polished customer-facing remodeling proposal copy for Proper Remodeling. Never change, calculate, invent, round, discount, or reinterpret any supplied price. Never invent company contact information, warranties, products, measurements, allowances, financing, or work not present in the supplied data. Do not expose internal pricing, markup, miscellaneous fees, commissions, or cost mechanics. Translate estimator line items into clear professional scope language. Allowance notes must state only supplied included allowance rates and never present them as cash credits. Return only the requested structured content.',input:JSON.stringify(prompt),text:{format:{type:'json_schema',name:'proper_proposal',strict:true,schema}}})});
  const raw=await ai.json();
  if(!ai.ok)return NextResponse.json({error:raw?.error?.message||'AI proposal generation failed.'},{status:502});
  const text=outputText(raw);
  let generated:any;
  try{generated=JSON.parse(text);}catch{return NextResponse.json({error:'AI returned an invalid proposal response.'},{status:502});}
  const number=`PRP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const proposalContent={brand:COMPANY,layout:'brochure_ai_one_project',estimate_number:estimate.estimate_number,customer:{name:customerName,email:lead?.email||null,phone:lead?.phone||null},project:{name:estimate.project_name||estimate.title,address:estimate.project_address,category:estimate.category_slug},pricing:{ninety_day:Number(estimate.ninety_day_price),today:Number(estimate.today_price)},ai:generated,workflow:{accepted_creates_contract:true}};
  const {data:proposal,error}=await supabase.from('customer_proposals').insert({organization_id:org.organization_id,estimate_id:estimate.id,proposal_number:number,template_name:'Proper Remodeling AI Brochure Proposal',title:estimate.project_name||estimate.title,scope_summary:generated.scope_summary,proposal_content:proposalContent,status:'draft',created_by:user.id}).select('id,estimate_id,proposal_number,title,status,scope_summary,proposal_content,accepted_by_name,accepted_at,created_at').single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({proposal});
}
