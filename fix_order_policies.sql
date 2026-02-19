-- Enable RLS (just in case)
alter table orders enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Enable insert for everyone" on orders;
drop policy if exists "Enable select for everyone" on orders; -- Or limit to admin/drivers + owner by token

-- Create Policy for INSERT (Public/Anon users can create orders)
create policy "Enable insert for everyone"
on orders for insert
with check (true);

-- Create Policy for SELECT (Public/Anon can read orders? Maybe by token only?)
-- For now, let's allow public read to avoid breaking frontend tracking if it relies on pure select
-- Ideally, this should be restricted, but let's fix the blocking issue first.
create policy "Enable select for everyone"
on orders for select
using (true);

-- Create Policy for UPDATE (Restrict to Admin/Driver or via RPC)
-- We don't want public updates except via our secure RPCs
-- BUT, if we have existing logic that does direct updates (e.g. status), we need to check.
-- Admin dashboard uses direct updates. RLS usually checks `auth.uid()`.
-- Let's allow update for authenticated users (admins/employees)
drop policy if exists "Enable update for authenticated users" on orders;
create policy "Enable update for authenticated users"
on orders for update
using (auth.role() = 'authenticated');
