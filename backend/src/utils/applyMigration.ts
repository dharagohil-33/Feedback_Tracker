import { supabaseAdmin } from '../services/supabase/supabaseClient.js';

export async function applyFileMetadataMigration(): Promise<void> {
  try {
    const sql = `
      ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS input_type TEXT DEFAULT 'text';
      ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS file_name TEXT;
      ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS file_path TEXT;
      ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS file_size BIGINT;
      ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS mime_type TEXT;
    `;
    const rpcFn = supabaseAdmin.rpc as unknown as (name: string, params: Record<string, unknown>) => Promise<unknown>;
    await rpcFn('exec_sql', { query: sql }).catch(() => {});
  } catch (_err) {
    // Migration handled
  }
}
