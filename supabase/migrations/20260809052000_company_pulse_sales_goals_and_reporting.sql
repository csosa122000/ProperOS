create table if not exists public.sales_goals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_month date not null,
  monthly_team_goal numeric not null default 0 check (monthly_team_goal >= 0),
  annual_team_goal numeric not null default 0 check (annual_team_goal >= 0),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, period_month),
  check (period_month = date_trunc('month', period_month)::date)
);

alter table public.sales_goals enable row level security;

drop policy if exists sales_goals_read on public.sales_goals;
create policy sales_goals_read on public.sales_goals for select
using (private.is_active_org_member(organization_id));

drop policy if exists sales_goals_manage on public.sales_goals;
create policy sales_goals_manage on public.sales_goals for all
using (private.has_org_permission(organization_id, 'accounting.finance.manage', null))
with check (private.has_org_permission(organization_id, 'accounting.finance.manage', null));

create or replace function public.get_sales_performance_metrics(target_organization_id uuid, target_user_id uuid default null)
returns table(issued_count bigint,sit_count bigint,full_demo_count bigint,sale_count bigint,sit_rate numeric,full_demo_rate numeric,close_rate numeric,lifetime_volume numeric,month_volume numeric,ytd_volume numeric,expected_commission numeric)
language sql stable security definer set search_path=''
as $$
  with lead_stats as (
    select count(*) filter (where d.counts_as_issued) issued_count,
           count(*) filter (where d.counts_as_sit) sit_count,
           count(*) filter (where d.counts_as_full_demo) full_demo_count,
           count(*) filter (where d.counts_as_sale) sale_count
    from public.leads l
    left join public.sales_dispositions d on d.organization_id=l.organization_id and d.key=l.disposition and d.is_active=true
    where l.organization_id=target_organization_id and l.deleted_at is null
      and (target_user_id is null or l.assigned_to=target_user_id)
      and coalesce(l.last_contact_at,l.updated_at,l.created_at) >= date_trunc('month',now())
  ), volumes as (
    select coalesce(sum(a.sold_price*sa.volume_percent/100.0),0) lifetime_volume,
           coalesce(sum(a.sold_price*sa.volume_percent/100.0) filter (where a.signed_at>=date_trunc('month',now())),0) month_volume,
           coalesce(sum(a.sold_price*sa.volume_percent/100.0) filter (where a.signed_at>=date_trunc('year',now())),0) ytd_volume
    from public.sales_allocations sa join public.accounting_jobs a on a.id=sa.accounting_job_id
    where sa.organization_id=target_organization_id and a.status<>'void'
      and (target_user_id is null or sa.rep_user_id=target_user_id)
  ), commissions as (
    select coalesce(sum(sc.commission_amount+coalesce(sc.performance_bonus_amount,0)+coalesce(sc.ride_along_bonus_amount,0)) filter (where sc.status in ('pending','approved')),0) expected_commission
    from public.sales_commissions sc where sc.organization_id=target_organization_id
      and (target_user_id is null or sc.rep_user_id=target_user_id)
  )
  select ls.issued_count,ls.sit_count,ls.full_demo_count,ls.sale_count,
         case when ls.issued_count>0 then round(ls.sit_count::numeric*100/ls.issued_count,1) else 0 end,
         case when ls.sit_count>0 then round(ls.full_demo_count::numeric*100/ls.sit_count,1) else 0 end,
         case when ls.sit_count>0 then round(ls.sale_count::numeric*100/ls.sit_count,1) else 0 end,
         v.lifetime_volume,v.month_volume,v.ytd_volume,c.expected_commission
  from lead_stats ls cross join volumes v cross join commissions c
  where private.is_active_org_member(target_organization_id);
$$;
grant execute on function public.get_sales_performance_metrics(uuid,uuid) to authenticated;

create or replace function public.get_lead_generator_leaderboard(target_organization_id uuid,target_department text,target_limit integer default 3)
returns table(workforce_member_id uuid,display_name text,credited_volume numeric,sale_count bigint,full_demo_count bigint)
language sql stable security definer set search_path=''
as $$
  select w.id,trim(w.first_name||' '||w.last_name),
         coalesce(sum(case when lb.bonus_type='sale' then lb.bonus_basis*lb.credit_percent/100.0 else 0 end),0),
         count(*) filter (where lb.bonus_type='sale'),count(*) filter (where lb.bonus_type='full_demo')
  from public.workforce_members w
  left join public.lead_bonuses lb on lb.workforce_member_id=w.id and lb.organization_id=w.organization_id and lb.created_at>=date_trunc('month',now())
  where w.organization_id=target_organization_id and w.department=target_department and w.status='active'
    and private.is_active_org_member(target_organization_id)
  group by w.id,w.first_name,w.last_name
  order by 3 desc,4 desc,5 desc,2
  limit greatest(1,least(coalesce(target_limit,3),10));
$$;
grant execute on function public.get_lead_generator_leaderboard(uuid,text,integer) to authenticated;

create or replace function public.get_accounting_summary(target_organization_id uuid)
returns table(accounts_receivable numeric,collected_this_month numeric,outstanding_commissions numeric,gross_profit numeric,funded_sales numeric)
language sql stable security definer set search_path=''
as $$
  with jobs as (select coalesce(sum(sold_price),0) sold,coalesce(sum(sold_price) filter (where funded_at is not null),0) funded from public.accounting_jobs where organization_id=target_organization_id and status<>'void'),
       payments as (select coalesce(sum(case when payment_type='refund' then -amount else amount end),0) total_paid,coalesce(sum(case when payment_type='refund' then -amount else amount end) filter (where payment_date>=date_trunc('month',current_date)::date),0) month_paid from public.customer_payments where organization_id=target_organization_id),
       costs as (select coalesce(sum(amount) filter (where cost_status in ('committed','paid')),0) total_cost from public.job_costs where organization_id=target_organization_id),
       commissions as (select coalesce(sum(commission_amount+coalesce(performance_bonus_amount,0)+coalesce(ride_along_bonus_amount,0)) filter (where status in ('pending','approved')),0) outstanding from public.sales_commissions where organization_id=target_organization_id)
  select greatest(j.sold-p.total_paid,0),p.month_paid,c.outstanding,j.sold-k.total_cost,j.funded
  from jobs j cross join payments p cross join costs k cross join commissions c
  where private.is_active_org_member(target_organization_id);
$$;
grant execute on function public.get_accounting_summary(uuid) to authenticated;
