drop trigger if exists production_job_after_contract_signed on public.contracts;

create trigger production_job_after_contract_signed
after insert or update of status on public.contracts
for each row
execute function private.production_job_after_contract_signed();

create or replace function private.production_job_after_contract_signed()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.status = 'signed' and (tg_op = 'INSERT' or old.status is distinct from 'signed') then
    perform private.sync_signed_contract_to_sales(new.id);
    perform private.create_production_job_for_contract(new.id);
  end if;
  return new;
end;
$function$;
