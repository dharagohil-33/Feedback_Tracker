import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { supabaseAnon, supabaseAdmin } from '../services/supabase/supabaseClient.js';
import { UnauthorizedError } from '../utils/errors.js';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  profile?: UserProfile;
  token?: string;
}

/**
 * Middleware that requires a valid Supabase Auth Bearer JWT token in the Authorization header.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header format');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication token not provided');
    }

    // Verify token using Supabase Auth Anon client (valid for JWT verification)
    const { data: authData, error: authError } = await supabaseAnon.auth.getUser(token);

    if (authError || !authData.user) {
      throw new UnauthorizedError('Invalid, expired, or revoked authentication token');
    }

    req.user = authData.user;
    req.token = token;

    // Retrieve profile from DB using try-catch
    let userProfile: UserProfile | null = null;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profile) {
        userProfile = profile as UserProfile;
      }
    } catch (_err) {
      // Ignore DB fetch error and use user_metadata fallback
    }

    req.profile = userProfile || {
      id: authData.user.id,
      full_name: (authData.user.user_metadata?.full_name as string) || null,
      email: authData.user.email || '',
      created_at: authData.user.created_at,
      updated_at: authData.user.created_at,
    };

    next();
  } catch (err) {
    next(err);
  }
}
