-- Add file metadata columns to public.feedback table
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS input_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Create indexes for efficient server-side search and filtering
CREATE INDEX IF NOT EXISTS idx_feedback_created_by ON public.feedback(created_by);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON public.feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON public.feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
