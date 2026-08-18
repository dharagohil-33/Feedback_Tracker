import { Request, Response, NextFunction } from 'express';
import { supabaseAnon, supabaseAdmin } from '../services/supabase/supabaseClient.js';
import { registerSchema, loginSchema } from '../schemas/authSchemas.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ValidationError, UnauthorizedError, AppError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { env } from '../config/env.js';

export async function registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new ValidationError(issue ? issue.message : 'Invalid registration input');
    }

    const { email, password, fullName } = parseResult.data;

    let userId: string | null = null;
    let userEmail: string = email;
    let sessionData: unknown = null;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
    const hasValidServiceKey =
      serviceKey &&
      !serviceKey.includes('placeholder') &&
      serviceKey.length > 10;

    // Strategy A: Admin API if valid Service Role Key exists
    if (hasValidServiceKey) {
      try {
        const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (!adminErr && adminData?.user) {
          userId = adminData.user.id;
          userEmail = adminData.user.email || email;
          const { data: loginRes } = await supabaseAnon.auth.signInWithPassword({ email, password });
          sessionData = loginRes?.session || null;
        } else if (adminErr) {
          console.warn('Admin createUser notice:', adminErr.message);
        }
      } catch (err) {
        console.warn('Admin createUser exception:', err);
      }
    }

    // Strategy B: Standard signup via Anon client
    if (!userId) {
      const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (authData?.user) {
        userId = authData.user.id;
        userEmail = authData.user.email || email;
        sessionData = authData.session;
      } else if (authError) {
        // If rate limited or existing user, check if we can log in directly with password
        const { data: loginRes } = await supabaseAnon.auth.signInWithPassword({ email, password });
        if (loginRes?.user && loginRes?.session) {
          userId = loginRes.user.id;
          userEmail = loginRes.user.email || email;
          sessionData = loginRes.session;
        } else {
          if (authError.message.toLowerCase().includes('rate limit')) {
            throw new AppError(
              'Supabase Cloud free email rate limit reached. Please copy your JWT service_role key (starting with eyJ...) from Tab 4 ("API Keys | Settings") into backend/.env.',
              400
            );
          }
          throw new AppError(authError.message, 400);
        }
      }
    }

    if (!userId) {
      throw new AppError('Failed to create user account', 400);
    }

    // Ensure profile row exists in public.profiles
    let profileData = null;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: userId,
            full_name: fullName,
            email: userEmail,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('*')
        .maybeSingle();
      profileData = profile;
    } catch (_err) {
      // Fallback
    }

    sendSuccess({
      res,
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        user: {
          id: userId,
          email: userEmail,
        },
        profile: profileData || {
          id: userId,
          full_name: fullName,
          email: userEmail,
        },
        session: sessionData,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new ValidationError(issue ? issue.message : 'Invalid login input');
    }

    const { email, password } = parseResult.data;

    // Authenticate with Supabase Auth
    let { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user || !authData.session) {
      // Try confirming user via admin API if email unconfirmed
      if (authError?.message?.toLowerCase().includes('email not confirmed')) {
        try {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = listData?.users?.find((u) => u.email === email);
          if (existingUser) {
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
            const retryAuth = await supabaseAnon.auth.signInWithPassword({ email, password });
            if (retryAuth.data.user && retryAuth.data.session) {
              authData = retryAuth.data;
              authError = null;
            }
          }
        } catch (_err) {
          // Ignore
        }
      }
    }

    if (authError || !authData.user || !authData.session) {
      if (authError?.message?.toLowerCase().includes('email not confirmed')) {
        throw new UnauthorizedError(
          'Email not confirmed in Supabase Auth. Please copy your JWT service_role key (starting with eyJ...) from Tab 4 ("API Keys | Settings") into backend/.env for instant auto-confirmation.'
        );
      }
      throw new UnauthorizedError(authError?.message || 'Invalid email or password');
    }

    // Retrieve user profile safely
    let profileData = null;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      profileData = profile;
    } catch (_err) {
      // Fallback
    }

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Login successful',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        profile: profileData || {
          id: authData.user.id,
          full_name: authData.user.user_metadata?.full_name || '',
          email: authData.user.email,
        },
        session: authData.session,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess({
      res,
      statusCode: 200,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User identity not authenticated');
    }

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Authenticated user profile retrieved',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          createdAt: req.user.created_at,
        },
        profile: req.profile,
      },
    });
  } catch (err) {
    next(err);
  }
}
