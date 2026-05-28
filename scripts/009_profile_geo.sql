-- 009_profile_geo.sql
-- Adds structured location + size to profiles so /admin market intel can
-- aggregate by suburb/state and the dealer-network directory can filter
-- meaningfully. Until now profiles.address was free-form text — no joins
-- possible.
--
-- Idempotent. Apply after 004_add_admin_roles.sql.

alter table public.profiles
  add column if not exists suburb            text,
  add column if not exists state             text not null default 'VIC'
    check (state in ('VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT')),
  add column if not exists dealership_size   text not null default 'small'
    check (dealership_size in ('solo', 'small', 'mid', 'large'));

-- Backfill suburb: pull a best-effort from existing address strings.
-- Pattern matches "<street>, <suburb> <STATE> <postcode>" — last comma-
-- separated chunk before the state abbreviation. Conservative: only sets
-- suburb when both a comma and a recognised state abbreviation are present
-- so we don't overwrite anything ambiguous.
update public.profiles
   set suburb = trim(
         regexp_replace(
           split_part(address, ',', array_length(string_to_array(address, ','), 1)),
           '\s+(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\s+\d{4}.*$',
           '',
           'i'
         )
       )
 where suburb is null
   and address is not null
   and address ~* '\s+(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\s+\d{4}';

-- Backfill state: pull the abbreviation if present in address.
update public.profiles
   set state = upper(substring(address from '\s+(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\s+\d{4}'))
 where state = 'VIC'  -- default — overwrite only when address tells us otherwise
   and address is not null
   and address ~* '\s+(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\s+\d{4}'
   and upper(substring(address from '\s+(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\s+\d{4}')) <> 'VIC';

create index if not exists profiles_state_idx  on public.profiles (state);
create index if not exists profiles_suburb_idx on public.profiles (suburb)
  where suburb is not null;

comment on column public.profiles.suburb is
  'Structured suburb for aggregation + dealer-network filtering. Free-form profiles.address remains the canonical mailing address.';
comment on column public.profiles.state is
  'Australian state/territory abbreviation. Defaults VIC until we expand.';
comment on column public.profiles.dealership_size is
  'Yard size band — solo (1-15 vehicles), small (16-40), mid (41-100), large (100+). Drives plan suggestions on the demo.';
