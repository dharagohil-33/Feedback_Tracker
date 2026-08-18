# AI Guidelines & Development Rules — AI Customer Feedback & Product Insights Tracker

These rules govern the development of the **AI Customer Feedback & Product Insights Tracker** application, derived directly from the assessment requirements document (`req.text`).

---

## 1. Architectural Integrity & Boundaries

- **Strict Frontend/Backend Separation**:
  - The Next.js frontend (`frontend/`) handles UI, routing, state display, and calls the Express REST API.
  - Next.js API routes (`frontend/src/app/api/`) MUST NOT be used for backend domain logic.
  - The Express backend (`backend/`) handles API endpoints, authentication verification, request validation via Zod, business logic, Supabase database & storage operations, OpenAI calls, and centralized error handling.
- **No Overengineering**:
  - Do NOT introduce Docker, Redis, Message Queues, Microservices, WebSockets, Prisma, GraphQL, or Redux.
  - Focus strictly on core assessment goals: correctness, maintainability, core functionality, explainability, and reasonable scope.
- **Explicit Exclusions**:
  - Do NOT build live chat, email/WhatsApp/SMS/social integrations, voice/video calls, CRM integrations, browser extensions, or real-time analytics.

---

## 2. Authentication & Authorization Rules

- Basic user authentication: Register, Login, Logout, Protected application routes.
- **Security Rule**: The backend must ALWAYS verify the authenticated user's Supabase access token (JWT) via `supabase.auth.getUser(token)` instead of trusting a user ID sent in the request body from the frontend.
- **Secrets Rule**: `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` MUST NEVER be exposed to the browser/frontend.

---

## 3. Data Model & Feedback Processing Rules

- **Feedback Record Schema**:
  - Required fields: Title, Customer Name, Customer Email, Feedback Date, Source, Content, Category, Status, Created Date, Updated Date.
  - Feedback Sources: `Customer Support`, `Survey`, `Product Review`, `Sales Team`, `Direct Feedback`, `Internal Team`, `Other`.
  - Feedback Categories: `Bug`, `Feature Request`, `Usability`, `Performance`, `Billing`, `Customer Service`, `Product Experience`, `Other`.
  - Sentiments: `Positive`, `Neutral`, `Negative`, `Frustrated`, `Very Positive`.
  - Feedback Types: `Bug Report`, `Feature Request`, `Complaint`, `Suggestion`, `Positive Feedback`, `General Feedback`.
- **Input Handling**:
  - Support both direct Text Input (Rich Text / Tiptap) and File Upload (Plain Text at minimum, stored in Supabase Storage `feedback-files` bucket).

---

## 4. AI Analysis & Hallucination Control Rules

- **Structured Output**: AI models (OpenAI API) must return valid structured JSON matching predefined schemas (Summary, Category, Type, Sentiment, Priority, Key Insights, Feature Requests, Recommended Actions).
- **Validation**: Validate all AI responses with Zod schemas before persisting to the database.
- **Hallucination Prevention**:
  - If a feedback record does not contain feature requests, set explicit null/empty states rather than inventing content.
  - Gracefully handle AI rate limits, timeouts, unexpected formatting, or API failures without crashing the backend.

---

## 5. Follow-Up Action & Notes Management

- **Action Items**: Description, Owner (default: `Unassigned`), Due Date (default: `Not specified`), Priority (`Low`, `Medium`, `High`), Status (`Open`, `In Progress`, `Blocked`, `Completed`).
- **Internal Notes**: Content, Created By, Created Date — kept completely separate from customer feedback content.

---

## 6. Dashboard & Analytics Rules

- Display core metrics: Total feedback, Positive/Negative count, High-priority items, Open/Completed actions, Unresolved feedback, Recent activity.
- Visualizations: Provide clean visual breakdown by category, sentiment, and source.

---

## 7. UI / UX & Quality Rules

- **Responsive Design**: Mobile, Tablet, and Desktop support.
- **Theme Support**: Seamless Light Mode & Dark Mode toggling with persistent state.
- **Rich Text Editing**: Integrate Tiptap for feedback content, summary display, internal notes, and action descriptions.
- **UI States**: Include clear Loading spinners/skeletons, Empty list states, AI processing indicators, Error banners, and Deletion confirmation dialogs.
- **Validation**: Enforce Zod validation on forms & API requests with friendly, user-understandable error messages (never leak raw stack traces or internal server error details).
