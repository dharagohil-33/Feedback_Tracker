# AI Customer Feedback & Product Insights Tracker

A production-ready full-stack application designed to capture customer feedback (text and `.txt` file uploads), process sentiment and themes using OpenAI API with zero-hallucination Zod response validation, store data in Supabase PostgreSQL & Storage, manage action items & internal team notes, and render real-time product intelligence metrics with a 100% zero-shadow UI featuring a vertical Sidebar navigation system.

---

## 🏗️ Architecture

The application strictly separates the Next.js frontend from the Express REST API backend:

```
Next.js Frontend (App Router, Tailwind CSS, TS, Zero-Shadow Sidebar Layout)
 ├── Sidebar Navigation Component (Overview, Feedback Workspace, Product Insights)
 ├── AuthContext (Supabase Auth Client + Bearer Token management)
 ├── ThemeContext (Dark / Light Mode System)
 ├── Typed ApiClient (Automatically injects Authorization: Bearer <token>)
 └── Pages: /login, /register, /dashboard, /feedback, /feedback/new, /feedback/[id], /insights
       │
       ▼ Authorization: Bearer <token>
Node.js + Express Backend (TypeScript, Zod, Centralized Error Handling)
 ├── requireAuth Middleware (Verifies Bearer token via supabaseAnon.auth.getUser)
 ├── Controllers: Auth, Feedback, Actions, Notes, Dashboard, Insights
 └── Services: Supabase Admin Service, Storage Service, AI Analysis Service
       │
       ├──► Supabase PostgreSQL (Database) & Supabase Storage ('feedback-files' bucket)
       └──► OpenAI API (gpt-4o-mini JSON Mode AI Feedback Analysis)
```

### Key Responsibilities

- **Next.js Frontend**: UI rendering, client-side interactions, theme toggling, vertical sidebar navigation, page routing, REST API communication via typed `apiClient`. Next.js API routes are **NOT** used for domain logic.
- **Express Backend**: REST API endpoints, Supabase Auth token verification (`requireAuth`), request validation via Zod, business logic, Supabase DB & Storage operations, OpenAI API integrations with strict Zod response validation, centralized error handling.

---

## 🗄️ Database Design & Row Level Security (RLS)

The database schema is managed via `supabase/migrations/` in Supabase PostgreSQL:

### PostgreSQL Tables & Relations
- `profiles`: Application-level user profile (linked to `auth.users.id`). Auto-created via `on_auth_user_created` trigger.
- `feedback`: Core customer feedback records (title, customer details, content, source, category, status, timestamps, `.txt` file metadata, and AI analysis fields).
- `feedback_insights`: Relational table storing granular AI-extracted customer insights (referenced to `feedback.id`).
- `feature_requests`: Relational table storing AI-extracted feature request details & priority (referenced to `feedback.id`).
- `actions`: Follow-up action tracking table (description, owner, due date, priority, status, linked to `feedback.id` and `created_by`).
- `internal_notes`: Team collaboration notes attached to feedback items (referenced to `feedback.id` and `created_by`).

### RLS Strategy
Row-Level Security is enabled on all tables:
- **`profiles`**: `USING (auth.uid() = id)` allows users to view and update only their own profile.
- **`feedback` / `actions` / `internal_notes`**: Authenticated users can view records and manage records created by their `auth.uid()`.
- **Backend Service Role**: Server-side backend queries bypass RLS safely after validating JWT access tokens in Express middleware.

---

## 🔒 Authentication & Security Architecture

1. **Client Signup/Login**: User submits credentials via `/register` or `/login` UI.
2. **Supabase Auth Integration**: Frontend authenticates directly with Supabase Auth to obtain a JWT `access_token`.
3. **Bearer Token Propagation**: Frontend sends requests to Express API (`http://localhost:5000/api/*`) with header `Authorization: Bearer <access_token>`.
4. **Backend Token Verification**: Express `requireAuth` middleware verifies the access token via `supabaseAnon.auth.getUser(token)`, attaches `req.user` & `req.profile`, and protects backend routes.
5. **Secrets Security**: `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` reside strictly in `backend/.env` and are never exposed to the client bundle.
6. **No Client Trust**: User identity is derived strictly from the verified JWT token (`created_by = req.user.id`). User IDs provided in request bodies are ignored.

---

## ✦ AI Integration & Response Validation

- **OpenAI Engine**: `gpt-4o-mini` with JSON response format enabled.
- **Strict Response Validation**: Output is validated using Zod (`aiAnalysisResponseSchema`) before persisting to database.
- **Supported Enums**:
  - `category`: `bug`, `feature_request`, `usability`, `performance`, `billing`, `customer_service`, `product_experience`, `other`
  - `feedbackType`: `bug_report`, `feature_request`, `complaint`, `suggestion`, `positive_feedback`, `general_feedback`
  - `sentiment`: `positive`, `neutral`, `negative`, `frustrated`, `very_positive`
  - `priority`: `low`, `medium`, `high`
- **Zero-Hallucination Mandate**: The AI prompt explicitly prohibits inventing feature requests or unsupported details. If no feature request is present, an empty array is returned.
- **Atomic Re-analysis**: Re-analyzing feedback purges previous `feedback_insights` and `feature_requests` before saving new results.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS (Zero-Shadow Design & Sidebar Navigation), ESLint
- **Backend**: Node.js, Express, TypeScript, Zod, `@supabase/supabase-js`, `openai`
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (JWT Bearer Token verification in Express)
- **File Storage**: Supabase Storage (`feedback-files` bucket)
- **AI Processing**: OpenAI API (`gpt-4o-mini`)

---

## 📡 Complete API Overview

| Method | Endpoint | Auth Required? | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | System health check endpoint |
| `POST` | `/api/auth/register` | No | Register new user account via Supabase Auth |
| `POST` | `/api/auth/login` | No | Authenticate user & return session JWT access token |
| `POST` | `/api/auth/logout` | Yes (`requireAuth`) | Revoke user session |
| `GET` | `/api/auth/me` | Yes (`requireAuth`) | Retrieve authenticated user & PostgreSQL profile |
| `GET` | `/api/feedback` | Yes (`requireAuth`) | Search, filter, and paginate customer feedback records |
| `POST` | `/api/feedback` | Yes (`requireAuth`) | Create new feedback record (text input or `.txt` file upload) |
| `GET` | `/api/feedback/:id` | Yes (`requireAuth`) | Retrieve single feedback record with insights & feature requests |
| `PUT` | `/api/feedback/:id` | Yes (`requireAuth`) | Update customer feedback record details |
| `DELETE` | `/api/feedback/:id` | Yes (`requireAuth`) | Delete feedback record and linked storage files |
| `POST` | `/api/feedback/:id/analyze` | Yes (`requireAuth`) | Execute OpenAI AI analysis & save structured insights |
| `GET` | `/api/actions` | Yes (`requireAuth`) | Retrieve follow-up action items |
| `POST` | `/api/actions` | Yes (`requireAuth`) | Create follow-up action item |
| `PUT` | `/api/actions/:id` | Yes (`requireAuth`) | Update action status, priority, owner, due date |
| `DELETE` | `/api/actions/:id` | Yes (`requireAuth`) | Delete action item |
| `GET` | `/api/feedback/:id/notes` | Yes (`requireAuth`) | Retrieve internal team notes for a feedback item |
| `POST` | `/api/feedback/:id/notes` | Yes (`requireAuth`) | Create internal team note |
| `PUT` | `/api/notes/:id` | Yes (`requireAuth`) | Update internal team note content |
| `DELETE` | `/api/notes/:id` | Yes (`requireAuth`) | Delete internal team note |
| `GET` | `/api/dashboard` | Yes (`requireAuth`) | Aggregated executive metrics & recent feedback items |
| `GET` | `/api/insights` | Yes (`requireAuth`) | Aggregated product analytics by category, sentiment, source, recurring issues, top feature requests |

---

## 🚀 Local Setup & Running Instructions

### 1. Install Dependencies

In the root directory:

```bash
cd frontend && npm install
cd ../backend && npm install
cd ..
```

### 2. Configure Environment Variables

- Create `backend/.env`:
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://cadecuuumbueuwfnxmbm.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

- Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=https://cadecuuumbueuwfnxmbm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Run Type Checks & Linter

```bash
npm run type-check
npm run lint
```

### 4. Build & Start Applications

```bash
# Build backend
cd backend && npm run build && npm run start

# Build frontend (Node >= 18.17.0 or Node 22)
cd frontend && npm run build && npm run start
```

---

## 📌 Completed Features & Capabilities

- [x] **Supabase Auth & Bearer Token Middleware**: Secure session management with Express JWT validation.
- [x] **Sidebar Navigation**: Left-rail vertical Sidebar layout hosting Overview, Feedback Workspace, and Product Insights.
- [x] **Feedback CRUD & `.txt` File Upload**: Full text entry and `.txt` file upload stored in Supabase Storage `feedback-files`.
- [x] **Multi-field Search & Filtering**: Multi-field search (`search`), category, sentiment, priority, status, source.
- [x] **AI Feedback Analysis Engine**: OpenAI `gpt-4o-mini` analysis, JSON Mode, Zod response validation, atomic deduplication.
- [x] **Action Item Management (CRUD)**: Follow-up actions with owner assignment, due date, priority, status dropdowns, and delete modal.
- [x] **Internal Team Notes (CRUD)**: Team collaboration notes with author profile metadata, kept separate from customer feedback.
- [x] **Executive Dashboard (`/dashboard`)**: Calculated metrics (Total Feedback, Positive, Negative, High Priority, Open/Completed Actions, Unresolved) and recent feedback list.
- [x] **Product Insights Analytics (`/insights`)**: Category, sentiment, source distribution, recurring issues list, top feature requests.
- [x] **100% Zero-Shadow Design System**: Sleek futuristic UI with dark/light mode toggle and zero box-shadows.

---

## ⚠️ Known Limitations & Future Improvements

- **Storage File Types**: Currently optimized for `.txt` text document uploads. Support for `.pdf` and `.docx` parsing can be added in future iterations using dedicated document parsing libraries (`pdf-parse`, `mammoth`).
- **Real-Time WebSockets**: Currently uses REST API polling for status updates. Supabase Realtime subscriptions can be integrated for live multi-user collaboration.
