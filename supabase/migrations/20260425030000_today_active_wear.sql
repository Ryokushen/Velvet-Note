alter table public.wears
  add column if not exists is_active boolean not null default false;

create unique index if not exists wears_one_active_per_user_day_idx
  on public.wears(user_id, worn_on)
  where is_active;

create or replace function public.set_active_wear(wear_id uuid)
returns public.wears
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_wear public.wears%rowtype;
begin
  select *
  into selected_wear
  from public.wears
  where id = wear_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Wear not found';
  end if;

  update public.wears
  set is_active = false
  where user_id = auth.uid()
    and worn_on = selected_wear.worn_on
    and id <> wear_id
    and is_active;

  update public.wears
  set is_active = true
  where id = wear_id
    and user_id = auth.uid()
  returning * into selected_wear;

  return selected_wear;
end;
$$;

grant execute on function public.set_active_wear(uuid) to authenticated;
