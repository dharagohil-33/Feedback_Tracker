import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from '../../config/env.js';

/**
 * Reusable Supabase admin client using Service Role Key for backend operations.
 * NEVER expose service role key to frontend.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport: WebSocket as any,
    },
  }
);

/**
 * Public client initialized with anon key for authentication operations.
 */
export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport: WebSocket as any,
    },
  }
);
