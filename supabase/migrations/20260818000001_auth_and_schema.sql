-- Schema Migration: Auth & Database Foundation
-- AI Customer Feedback & Product Insights Tracker

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.feedback_source_enum AS ENUM (
    'customer_support', 'survey', 'product_review', 'sales_team', 'direct_feedback', 'internal_team', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.feedback_category_enum AS ENUM (
    'bug', 'feature_request', 'usability', 'performance', 'billing', 'customer_service', 'product_experience', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.feedback_status_enum AS ENUM (
    'new', 'under_review', 'in_progress', 'resolved', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.feedback_sentiment_enum AS ENUM (
    'positive', 'neutral', 'negative', 'frustrated', 'very_positive'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.feedback_type_enum AS ENUM (
    'bug_report', 'feature_request', 'complaint', 'suggestion', 'positive_feedback', 'general_feedback'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_status_enum AS ENUM (
    'pending', 'processing', 'completed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.priority_enum AS ENUM (
    'low', 'medium', 'high'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.action_status_enum AS ENUM (
    'open', 'in_progress', 'blocked', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- -----------------------------------------------------------------------------
-- TABLE: profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- -----------------------------------------------------------------------------
-- TABLE: feedback
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  feedback_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source public.feedback_source_enum NOT NULL DEFAULT 'direct_feedback',
  content TEXT NOT NULL,
  category public.feedback_category_enum NOT NULL DEFAULT 'other',
  status public.feedback_status_enum NOT NULL DEFAULT 'new',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- AI Generated Fields
  summary TEXT,
  feedback_type public.feedback_type_enum,
  sentiment public.feedback_sentiment_enum,
  priority public.priority_enum DEFAULT 'medium',
  product_area TEXT,
  ai_status public.ai_status_enum DEFAULT 'pending',
  ai_processed_at TIMESTAMPTZ
);


-- -----------------------------------------------------------------------------
-- TABLE: feedback_insights
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  insight_type TEXT,
  confidence NUMERIC(3, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- TABLE: feature_requests
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  feature_description TEXT NOT NULL,
  reason TEXT,
  customer_impact TEXT,
  priority public.priority_enum DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- TABLE: actions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES public.feedback(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  owner TEXT DEFAULT 'Unassigned',
  due_date TIMESTAMPTZ,
  priority public.priority_enum DEFAULT 'medium',
  status public.action_status_enum DEFAULT 'open',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- TABLE: internal_notes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_feedback_created_by ON public.feedback(created_by);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON public.feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON public.feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_insights_feedback_id ON public.feedback_insights(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_feedback_id ON public.feature_requests(feedback_id);
CREATE INDEX IF NOT EXISTS idx_actions_feedback_id ON public.actions(feedback_id);
CREATE INDEX IF NOT EXISTS idx_actions_created_by ON public.actions(created_by);
CREATE INDEX IF NOT EXISTS idx_internal_notes_feedback_id ON public.internal_notes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_created_by ON public.internal_notes(created_by);


-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Feedback Policies
CREATE POLICY "Authenticated users can select feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update own feedback"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete own feedback"
  ON public.feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Feedback Insights Policies
CREATE POLICY "Authenticated users can select insights"
  ON public.feedback_insights FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage insights"
  ON public.feedback_insights FOR ALL
  TO authenticated
  USING (true);

-- Feature Requests Policies
CREATE POLICY "Authenticated users can select feature requests"
  ON public.feature_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage feature requests"
  ON public.feature_requests FOR ALL
  TO authenticated
  USING (true);

-- Actions Policies
CREATE POLICY "Authenticated users can select actions"
  ON public.actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert actions"
  ON public.actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Authenticated users can update actions"
  ON public.actions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete actions"
  ON public.actions FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Internal Notes Policies
CREATE POLICY "Authenticated users can select notes"
  ON public.internal_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notes"
  ON public.internal_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Authenticated users can update notes"
  ON public.internal_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete notes"
  ON public.internal_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);
