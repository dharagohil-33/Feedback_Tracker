import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from backend root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  SUPABASE_URL: z.string().url().default('https://cadecuuumbueuwfnxmbm.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder_service_role_key_to_be_replaced'),
  OPENAI_API_KEY: z.string().default('placeholder_openai_api_key_to_be_replaced'),
  OPENROUTER_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
