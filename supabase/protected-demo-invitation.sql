-- Run once in the Supabase SQL Editor to permanently protect the homepage demo.
-- This blocks direct API deletes too, not only the dashboard button.

create or replace function public.protect_homepage_demo_invitation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.public_slug = 'хангай-сарнай-skehsd' then
    raise exception 'The homepage demo invitation cannot be deleted or have its public slug changed';
  end if;

  return old;
end;
$$;

drop trigger if exists invitations_protect_homepage_demo on public.invitations;
create trigger invitations_protect_homepage_demo
  before delete or update of public_slug on public.invitations
  for each row
  execute function public.protect_homepage_demo_invitation();
