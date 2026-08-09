import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const routePermissions:[string,string][]=[
  ['/crm','crm.leads.view'],
  ['/sales','app.sales.view'],
  ['/estimates','app.sales_documents.view'],
  ['/proposals','app.sales_documents.view'],
  ['/contracts','app.sales_documents.view'],
  ['/production','app.production.view'],
  ['/canvassing','app.canvassing.view'],
  ['/marketing','app.marketing.view'],
  ['/human-resources','hr.workforce.view'],
  ['/accounting','app.accounting.view'],
  ['/university','training.content.view'],
  ['/settings','organization.settings.view'],
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  type CookieToSet = { name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] };
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>request.cookies.getAll(),setAll:(items:CookieToSet[])=>{items.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
  const {data:{user}}=await supabase.auth.getUser();
  const path=request.nextUrl.pathname;
  const authPath=['/login','/forgot-password','/update-password'].some(prefix=>path.startsWith(prefix));
  if(!user&&!authPath)return NextResponse.redirect(new URL('/login',request.url));
  if(!user)return response;
  if(path.startsWith('/login'))return NextResponse.redirect(new URL('/dashboard',request.url));

  const required=routePermissions.find(([prefix])=>path.startsWith(prefix))?.[1];
  if(required){
    const {data:orgs}=await supabase.rpc('get_my_organizations');
    const org=orgs?.[0];
    const permissions=(org?.permissions||[]) as string[];
    if(!org||!permissions.includes(required))return NextResponse.redirect(new URL('/dashboard?denied=1',request.url));
  }
  return response;
}

export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
