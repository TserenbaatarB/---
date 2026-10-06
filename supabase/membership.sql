-- Run once in the Supabase SQL Editor to enable monthly memberships.
-- The owner approves transfers from /dashboard/admin/payments after checking the bank account.
-- The initial admin email is tsb.0318@gmail.com; update both RPC email checks if it changes.
-- Monthly access costs MNT 19,900 and starts/extends only after approval.

create table if not exists public.user_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.membership_payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount = 19900),
  payer_name text not null check (char_length(trim(payer_name)) between 1 and 120),
  payer_phone text not null check (char_length(trim(payer_phone)) between 1 and 30),
  payment_reference text not null check (char_length(trim(payment_reference)) between 1 and 120),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create unique index if not exists membership_one_pending_request_per_user
  on public.membership_payment_requests (user_id)
  where status = 'pending';

alter table public.user_memberships enable row level security;
alter table public.membership_payment_requests enable row level security;

drop policy if exists "users read own membership" on public.user_memberships;
create policy "users read own membership" on public.user_memberships
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "users read own membership requests" on public.membership_payment_requests;
create policy "users read own membership requests" on public.membership_payment_requests
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "users submit own membership requests" on public.membership_payment_requests;
create policy "users submit own membership requests" on public.membership_payment_requests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and amount = 19900
    and status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
  );

revoke insert, update, delete on public.user_memberships from anon, authenticated;
revoke update, delete on public.membership_payment_requests from anon, authenticated;
grant select on public.user_memberships to authenticated;
grant select, insert on public.membership_payment_requests to authenticated;

create or replace function public.admin_list_membership_payments()
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  amount integer,
  payer_name text,
  payer_phone text,
  payment_reference text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'tsb.0318@gmail.com' then
    raise exception 'Not authorized to review membership payments';
  end if;

  return query
    select r.id, r.user_id, u.email::text, r.amount, r.payer_name,
           r.payer_phone, r.payment_reference, r.created_at
    from public.membership_payment_requests r
    join auth.users u on u.id = r.user_id
    where r.status = 'pending'
    order by r.created_at asc;
end;
$$;

create or replace function public.admin_review_membership_payment(
  p_request_id uuid,
  p_decision text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_request public.membership_payment_requests%rowtype;
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'tsb.0318@gmail.com' then
    raise exception 'Not authorized to review membership payments';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  select * into payment_request
  from public.membership_payment_requests
  where id = p_request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'Pending membership payment request not found';
  end if;

  update public.membership_payment_requests
  set status = p_decision,
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_request_id;

  if p_decision = 'approved' then
    insert into public.user_memberships as existing_membership
      (user_id, expires_at, updated_at, updated_by)
    values (payment_request.user_id, now() + interval '1 month', now(), auth.uid())
    on conflict (user_id) do update
    set expires_at = greatest(existing_membership.expires_at, now()) + interval '1 month',
        updated_at = now(),
        updated_by = auth.uid();
  end if;
end;
$$;

revoke all on function public.admin_list_membership_payments() from public, anon;
revoke all on function public.admin_review_membership_payment(uuid, text) from public, anon;
grant execute on function public.admin_list_membership_payments() to authenticated;
grant execute on function public.admin_review_membership_payment(uuid, text) to authenticated;

create or replace function public.require_active_membership_to_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published'
     and not exists (
       select 1
       from public.user_memberships m
       where m.user_id = new.user_id
         and m.expires_at > now()
     ) then
    raise exception 'An active monthly membership is required to publish invitations';
  end if;

  return new;
end;
$$;

drop trigger if exists invitations_require_active_membership on public.invitations;
create trigger invitations_require_active_membership
  before insert or update of status on public.invitations
  for each row
  execute function public.require_active_membership_to_publish();
