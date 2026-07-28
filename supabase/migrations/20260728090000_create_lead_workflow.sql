create or replace function public.create_lead_with_details(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_lead_id uuid;
  new_property_id uuid;
  organization_id uuid := (payload->>'organization_id')::uuid;
  branch_id uuid := nullif(payload->>'branch_id', '')::uuid;
  assigned_to uuid := nullif(payload->>'assigned_to', '')::uuid;
  appointment_starts_at timestamptz := nullif(payload->>'appointment_starts_at', '')::timestamptz;
  lead_status_value public.lead_status := coalesce(nullif(payload->>'status', ''), 'new')::public.lead_status;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(payload->>'first_name'), '') is null
    or nullif(trim(payload->>'last_name'), '') is null
    or nullif(trim(payload->>'project_type'), '') is null then
    raise exception 'First name, last name, and project type are required';
  end if;

  if nullif(trim(payload->>'address_line1'), '') is null
    or nullif(trim(payload->>'city'), '') is null
    or nullif(trim(payload->>'state'), '') is null
    or nullif(trim(payload->>'postal_code'), '') is null then
    raise exception 'A complete job-site address is required';
  end if;

  insert into public.leads (
    organization_id,
    branch_id,
    assigned_to,
    first_name,
    last_name,
    email,
    phone,
    source,
    status,
    project_interest,
    summary,
    preferred_contact_method,
    created_by
  )
  values (
    organization_id,
    branch_id,
    assigned_to,
    trim(payload->>'first_name'),
    trim(payload->>'last_name'),
    nullif(trim(payload->>'email'), ''),
    nullif(trim(payload->>'phone'), ''),
    nullif(trim(payload->>'lead_source'), ''),
    lead_status_value,
    array[trim(payload->>'project_type')],
    nullif(trim(payload->>'notes'), ''),
    coalesce(nullif(payload->>'preferred_contact_method', ''), 'phone'),
    auth.uid()
  )
  returning id into new_lead_id;

  insert into public.properties (
    organization_id,
    lead_id,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    created_by
  )
  values (
    organization_id,
    new_lead_id,
    trim(payload->>'address_line1'),
    nullif(trim(payload->>'address_line2'), ''),
    trim(payload->>'city'),
    upper(trim(payload->>'state')),
    trim(payload->>'postal_code'),
    auth.uid()
  )
  returning id into new_property_id;

  if appointment_starts_at is not null then
    insert into public.appointments (
      organization_id,
      branch_id,
      lead_id,
      property_id,
      assigned_to,
      title,
      starts_at,
      ends_at,
      notes,
      created_by
    )
    values (
      organization_id,
      branch_id,
      new_lead_id,
      new_property_id,
      assigned_to,
      trim(payload->>'project_type') || ' consultation — ' ||
        trim(payload->>'first_name') || ' ' || trim(payload->>'last_name'),
      appointment_starts_at,
      appointment_starts_at + interval '1 hour',
      nullif(trim(payload->>'notes'), ''),
      auth.uid()
    );
  end if;

  insert into public.lead_activities (
    organization_id,
    lead_id,
    actor_user_id,
    activity_type,
    title,
    details
  )
  values (
    organization_id,
    new_lead_id,
    auth.uid(),
    'lead_created',
    'Lead created',
    jsonb_build_object(
      'source', nullif(trim(payload->>'lead_source'), ''),
      'project_type', trim(payload->>'project_type'),
      'appointment_set', appointment_starts_at is not null
    )
  );

  return new_lead_id;
end;
$$;

revoke all on function public.create_lead_with_details(jsonb) from public;
revoke all on function public.create_lead_with_details(jsonb) from anon;
grant execute on function public.create_lead_with_details(jsonb) to authenticated;
