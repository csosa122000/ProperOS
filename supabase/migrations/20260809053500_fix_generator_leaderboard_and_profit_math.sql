create or replace function public.get_lead_generator_leaderboard(target_organization_id uuid,target_department text,target_limit integer default 3)
returns table(workforce_member_id uuid,display_name text,credited_volume numeric,sale_count bigint,full_demo_count bigint)
language sql stable security definer set search_path=''
as $$
  select w.id,trim(w.first_name||' '||w.last_name),
         coalesce(sum(case when lb.bonus_type='sold_job' then lb.bonus_basis*lb.credit_percent/100.0 else 0 end),0),
         count(*) filter (where lb.bonus_type='sold_job'),
         count(*) filter (where lb.bonus_type='full_demo')
  from public.workforce_members w
  left join public.lead_bonuses lb on lb.workforce_member_id=w.id and lb.organization_id=w.organization_id and lb.created_at>=date_trunc('month',now()) and lb.status<>'void'
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
  with jobs as (
    select coalesce(sum(sold_price),0) sold,coalesce(sum(sold_price) filter (where funded_at is not null),0) funded
    from public.accounting_jobs where organization_id=target_organization_id and status<>'void'
  ), payments as (
    select coalesce(sum(case when payment_type='refund' then -amount else amount end),0) total_paid,
           coalesce(sum(case when payment_type='refund' then -amount else amount end) filter (where payment_date>=date_trunc('month',current_date)::date),0) month_paid
    from public.customer_payments where organization_id=target_organization_id
  ), costs as (
    select coalesce(sum(amount) filter (where cost_status in ('committed','paid')),0) total_cost
    from public.job_costs where organization_id=target_organization_id
  ), commissions as (
    select coalesce(sum(commission_amount+coalesce(performance_bonus_amount,0)+coalesce(ride_along_bonus_amount,0)) filter (where status<>'void'),0) all_commissions,
           coalesce(sum(commission_amount+coalesce(performance_bonus_amount,0)+coalesce(ride_along_bonus_amount,0)) filter (where status in ('pending','approved')),0) outstanding
    from public.sales_commissions where organization_id=target_organization_id
  ), bonuses as (
    select coalesce(sum(bonus_amount) filter (where status<>'void'),0) all_bonuses
    from public.lead_bonuses where organization_id=target_organization_id
  )
  select greatest(j.sold-p.total_paid,0),p.month_paid,c.outstanding,j.sold-k.total_cost-c.all_commissions-b.all_bonuses,j.funded
  from jobs j cross join payments p cross join costs k cross join commissions c cross join bonuses b
  where private.is_active_org_member(target_organization_id);
$$;
grant execute on function public.get_accounting_summary(uuid) to authenticated;
