# AI Usage Report — AI Customer Feedback & Product Insights Tracker

**Project Name**: AI Customer Feedback & Product Insights Tracker  
**Author**: Engineering Team  
**Date**: August 18, 2026  

---

## 1. Executive Summary

This report documents the use of Artificial Intelligence (AI) tools during the planning, design, implementation, debugging, and verification of the **AI Customer Feedback & Product Insights Tracker**. The application leverages an AI agent assistant paired with OpenAI API integration (`gpt-4o-mini`) for processing customer intelligence.

---

## 2. AI Tools Used & Application Scope

| AI Tool / Framework | Primary Purpose & Usage Scope |
|---|---|
| **Antigravity AI Assistant** | Full-stack pair programming assistant used for code generation, architectural planning, Zod schema design, Express route construction, React/Next.js component implementation, and automated testing scripts. |
| **OpenAI API (`gpt-4o-mini`)** | Core application intelligence engine integrated into the Express backend service (`aiService.ts`) to perform automated feedback summary generation, sentiment analysis, priority assignment, category classification, key insight extraction, and feature request identification. |

---

## 3. Important Prompts & Workflows

### A. Feedback Analysis System Prompt (`aiService.ts`)
```text
You are an expert AI customer feedback analyzer. 
Your task is to analyze raw customer feedback and return structured JSON output.

STRICT MANDATES:
1. Zero Hallucination: Do NOT invent information not present in the customer feedback.
2. If there are no feature requests, return an empty array [] for featureRequests.
3. Priority MUST be one of: "low", "medium", "high".
4. Category MUST be one of supported categories.
5. Sentiment MUST be one of supported sentiments.
```

### B. Architectural Guidance Prompts
- **Auth & JWT Scoping**: *"Enforce strict Supabase JWT Bearer token authentication in Express (`requireAuth`). Derive user identity strictly from `req.user.id` and never trust client-provided user IDs."*
- **Zero-Shadow Compliance**: *"Maintain a 100% zero-shadow design system across all dark and light themes without using `box-shadow` or `drop-shadow` classes."*

---

## 4. AI-Generated Code Corrections & Manual Engineering

While AI models generated boilerplates for components and routes, several critical manual corrections and engineering adjustments were made:

### 1. Database Enum Mapping Alignments
- **Issue**: Initial AI-generated schemas attempted to write string literals such as `'Critical'` or `'Feature Request'` directly into PostgreSQL columns, resulting in PostgreSQL enum constraint errors (`invalid input value for enum priority_enum`).
- **Correction**: Built explicit bidirectional mapper dictionaries in `feedbackService.ts` and `actionService.ts`:
  - Priority: `'Low'` $\leftrightarrow$ `'low'`, `'Medium'` $\leftrightarrow$ `'medium'`, `'High'` $\leftrightarrow$ `'high'` (with `'critical'` mapped to `'high'`).
  - Action Status: `'Open'` $\leftrightarrow$ `'open'`, `'In Progress'` $\leftrightarrow$ `'in_progress'`, `'Blocked'` $\leftrightarrow$ `'blocked'`, `'Completed'` $\leftrightarrow$ `'completed'`.

### 2. Rate Limit & Authentication Bypass
- **Issue**: Supabase Auth email rate limits blocked repeated test user signups during development (`400 Bad Request`).
- **Correction**: Switched signup logic in seed scripts to `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })`, bypassing email rate limits and auto-confirming user accounts.

### 3. Zod Response Validation & Heuristic Fallbacks
- **Issue**: Large Language Models can occasionally return non-compliant JSON keys or hallucinated enum values.
- **Correction**: Implemented strict Zod schema validation (`aiAnalysisResponseSchema.parse(json)`). Integrated a smart NLP heuristic fallback analyzer engine in `aiService.ts` that triggers automatically if the OpenAI API is unreachable or fails schema validation.

---

## 5. Security & Architectural Decisions Identified

1. **Secrets Isolation**:
   - `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are kept strictly in `backend/.env`. They are never passed to Next.js public environment variables (`NEXT_PUBLIC_`) or exposed to client browsers.
2. **Backend JWT Authorization**:
   - Express REST API validates incoming `Authorization: Bearer <token>` headers via `supabaseAnon.auth.getUser(token)`. Frontend user identity is strictly derived from the verified token.
3. **Atomic Re-analysis Deduplication**:
   - Re-running AI analysis on a feedback item executes an atomic database operation that purges previous `feedback_insights` and `feature_requests` associated with that `feedback_id` before inserting new results, preventing duplicate record buildup.

---

## 6. Code Quality & Validation Methodology

All AI-generated code underwent rigorous verification:
- **TypeScript Static Verification**: `npm run type-check` executed across both frontend and backend packages (0 errors).
- **ESLint Code Quality**: `npm run lint` executed across both frontend and backend packages (0 errors, 0 warnings).
- **E2E Production Build**: Tested `next build` on Node 22 (`✓ Compiled successfully`, `✓ Generating static pages (11/11)`).
- **Runtime REST API Verification**: Automated `curl` scripts tested user authentication, feedback CRUD, `.txt` file uploads, AI analysis, actions CRUD, notes CRUD, dashboard metrics, and insights analytics.
