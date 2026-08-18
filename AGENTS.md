# Project Guidelines & Rules — AI Customer Feedback & Product Insights Tracker

## Architecture Rules
1. **Frontend (`frontend/`)**: Next.js App Router, TypeScript, Tailwind CSS. Responsible ONLY for UI, page routing, client state, and REST API calls. Next.js API routes MUST NOT contain domain logic.
2. **Backend (`backend/`)**: Express API with TypeScript. Responsible for routes, authentication verification (Supabase JWT), request validation (Zod), business logic, database queries, file storage, OpenAI API calls, and centralized error handling.
3. **Database & Storage (`supabase/`)**: Supabase PostgreSQL migrations and file bucket abstractions.
4. **Environment Secrets**: Never expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` to the frontend.

## Coding Standards
- TypeScript Strict Mode (`tsc --noEmit` must pass with 0 errors).
- ESLint (`npm run lint` must pass with 0 warnings/errors).
- Friendly user error messages (never expose raw stack traces to the client).
- Robust AI JSON validation with Zod to prevent AI hallucinations.
