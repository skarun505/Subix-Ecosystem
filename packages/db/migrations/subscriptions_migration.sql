-- Execute this file in your Supabase SQL Editor
-- This creates the subscription table to track trial periods

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  plan text DEFAULT 'trial',
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own subscription data
CREATE POLICY "Users can view their own subscription" 
ON subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Optional: Allow inserting from the frontend anon key (if they already have a session)
CREATE POLICY "Users can insert their own trial" 
ON subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ===============================================================
-- 🚀 AUTO-TRIAL CREATION TRIGGER
-- This automatically generates a 30-day trial the moment a user signs up.
-- This is much more secure and reliable than doing it in frontend Javascript!
-- ===============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, trial_start, trial_end, plan, status)
  VALUES (
    new.id,
    now(),
    now() + interval '30 days',
    'trial',
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to Supabase's auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_trial();
