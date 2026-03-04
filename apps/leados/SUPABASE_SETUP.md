# Supabase Backend Setup Guide for LeadOS

Since you are new to backend setup, Supabase is an excellent choice! It gives you a real PostgreSQL database, Authentication, and an API instantly.

Follow these steps to set up your backend backend.

## Step 1: Create a Supabase Project

1.  Go to [https://supabase.com](https://supabase.com) and click **"Start your project"**.
2.  Sign up with GitHub or email.
3.  Click **"New Project"**.
4.  **Organization**: Choose the default one.
5.  **Name**: Enter `LeadOS`.
6.  **Database Password**: Generate a strong password and save it somewhere safe (you likely won't need it often, but good to have).
7.  **Region**: Choose a region close to you (e.g., `Mumbai` if you are in India).
8.  Click **"Create new project"**.
    *   *Wait for a minute or two while the database is being set up.*

## Step 2: Get Your API Keys

Once the project is created:
1.  Go to **Project Settings** (the cog icon ⚙️ at the bottom of the left sidebar).
2.  Click on **"API"**.
3.  Look for the **Project URL** and **Project API keys**.
    *   You will need the **Project URL**.
    *   You will need the **`anon`** public key.
    
    > ⚠️ **Keep these ready!** You will need to paste them into the code later.

## Step 3: Create Database Tables (SQL)

Supabase has a "SQL Editor" where you can run code to create your tables instantly.

1.  Click on the **SQL Editor** icon ( _>_ ) in the left sidebar.
2.  Click **"New Query"**.
3.  **Copy and Paste** the following SQL code into the editor:

```sql
-- 1. Create Leads Table
create table public.leads (
  lead_id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Contact Info
  name text not null,
  phone text,
  email text,
  secondary_phone text,
  
  -- Details
  source text default 'Manual',
  status text default 'New',
  company text,
  designation text,
  
  -- Business Logic
  lead_score integer default 0,
  budget numeric,
  expected_close_date date,
  tags text[], 
  
  -- Assignment
  assigned_to uuid, 
  
  -- Metadata
  notes text,
  is_archived boolean default false
);

-- 2. Create Activities Table (for logs and history)
create table public.activities (
  activity_id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  lead_id uuid references public.leads(lead_id) on delete cascade,
  
  activity_type text not null, -- 'call', 'email', 'status_change', 'note'
  description text,
  performed_by text default 'system',
  metadata jsonb
);

-- 3. Create Follow Ups Table (Phase 2)
create table public.follow_ups (
  follow_up_id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  lead_id uuid references public.leads(lead_id) on delete cascade,
  
  scheduled_date date not null,
  scheduled_time time,
  type text default 'call', -- 'call', 'meeting', 'email'
  notes text,
  status text default 'pending', -- 'pending', 'completed', 'cancelled'
  
  created_by text
);

-- 4. Enable Realtime (Optional but cool)
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table activities;

-- 5. RELAX SECURITY FOR DEVELOPMENT (IMPORTANT!)
-- By default, Supabase blocks all access. We will enable public access for your prototype.
-- In a real production app, we would set up proper Row Level Security (RLS).

alter table public.leads enable row level security;
alter table public.activities enable row level security;
alter table public.follow_ups enable row level security;

-- Policy: Allow unrestricted access to everyone (User Verification handled in frontend for now)
create policy "Enable all access for all users" on public.leads for all using (true) with check (true);
create policy "Enable all access for all users" on public.activities for all using (true) with check (true);
create policy "Enable all access for all users" on public.follow_ups for all using (true) with check (true);
```

4.  Click **"Run"** (bottom right).
    *   It should say "Success" in the results pane.

## Step 4: Let Me Know!

Once you have done this, please reply with:
1.  **"Done"**
2.  Provide your **Project URL**
3.  Provide your **`anon` Key**

I will then connect your app to this new database!
