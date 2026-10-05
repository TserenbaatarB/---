-- RSVP (Хариу авах) — Supabase SQL Editor дээр нэг удаа ажиллуулна.

alter table public.invitations
  add column if not exists extras jsonb not null default '{}'::jsonb;

create table if not exists public.invitation_rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  phone text check (char_length(phone) <= 30),
  status text not null check (status in ('yes', 'no')),
  guests int not null default 0 check (guests between 0 and 20),
  message text check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists invitation_rsvps_invitation_idx
  on public.invitation_rsvps (invitation_id, created_at desc);

alter table public.invitation_rsvps enable row level security;

drop policy if exists "owner reads rsvps" on public.invitation_rsvps;
create policy "owner reads rsvps" on public.invitation_rsvps
  for select to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_id and i.user_id = auth.uid()
  ));

drop policy if exists "owner deletes rsvps" on public.invitation_rsvps;
create policy "owner deletes rsvps" on public.invitation_rsvps
  for delete to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_id and i.user_id = auth.uid()
  ));

-- Нийтлэгдсэн урилгын RSVP тохиргоо
create or replace function public.get_public_rsvp_settings(p_slug text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'enabled', coalesce((extras->>'rsvpEnabled')::boolean, false),
    'askGuests', coalesce((extras->>'rsvpAskGuests')::boolean, false),
    'deadline', coalesce(extras->>'rsvpDeadline', ''),
    'visibility', coalesce(extras->>'rsvpVisibility', 'open')
  )
  from public.invitations
  where public_slug = p_slug and published_at is not null
  limit 1;
$$;

-- Зочны хариу илгээх
create or replace function public.submit_rsvp(
  p_slug text,
  p_name text,
  p_phone text,
  p_status text,
  p_guests int,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  deadline text;
begin
  select id, extras into inv
  from public.invitations
  where public_slug = p_slug and published_at is not null
  limit 1;

  if inv.id is null or not coalesce((inv.extras->>'rsvpEnabled')::boolean, false) then
    raise exception 'rsvp_disabled';
  end if;

  deadline := coalesce(inv.extras->>'rsvpDeadline', '');

  if deadline ~ '^\d{4}-\d{2}-\d{2}$' and current_date > deadline::date then
    raise exception 'rsvp_closed';
  end if;

  if p_status not in ('yes', 'no') or char_length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'rsvp_invalid';
  end if;

  insert into public.invitation_rsvps (invitation_id, name, phone, status, guests, message)
  values (
    inv.id,
    left(trim(p_name), 100),
    left(nullif(trim(coalesce(p_phone, '')), ''), 30),
    p_status,
    case
      when p_status = 'yes' and coalesce((inv.extras->>'rsvpAskGuests')::boolean, false)
        then greatest(0, least(coalesce(p_guests, 0), 20))
      else 0
    end,
    left(nullif(trim(coalesce(p_message, '')), ''), 500)
  );
end;
$$;

-- Зочдод харагдах хариуны нэгтгэл (visibility-ийг дагана)
create or replace function public.get_public_rsvps(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  visibility text;
  result jsonb;
begin
  select id, extras into inv
  from public.invitations
  where public_slug = p_slug and published_at is not null
  limit 1;

  if inv.id is null then
    return null;
  end if;

  visibility := coalesce(inv.extras->>'rsvpVisibility', 'open');

  if visibility = 'hidden' then
    return null;
  end if;

  select jsonb_build_object(
    'yes', count(*) filter (where status = 'yes'),
    'no', count(*) filter (where status = 'no'),
    'guests', coalesce(sum(1 + guests) filter (where status = 'yes'), 0),
    'list', case when visibility = 'open' then coalesce(
      (select jsonb_agg(jsonb_build_object('name', r.name, 'status', r.status, 'guests', r.guests)
         order by r.created_at desc)
       from (select * from public.invitation_rsvps
             where invitation_id = inv.id order by created_at desc limit 100) r),
      '[]'::jsonb) else '[]'::jsonb end
  ) into result
  from public.invitation_rsvps
  where invitation_id = inv.id;

  return result;
end;
$$;

grant execute on function public.get_public_rsvp_settings(text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, text, text, text, int, text) to anon, authenticated;
grant execute on function public.get_public_rsvps(text) to anon, authenticated;
