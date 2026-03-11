# AI-Powered Issue Intelligence Suite

This document describes where each AI feature appears, when it runs, and what data it reads/writes.

## Feature Matrix

| Feature | UI Location | Trigger | Reads | Writes |
|---|---|---|---|---|
| Smart Task Summarization | `Create Task` form (`✨ Generate AI Summary`), `Task Details` panel | User clicks **Generate AI Summary** | `title`, `description` | `Task.aiSummary` when task is created/updated |
| AI Priority Suggestion | `Create Task` form next to Priority (`🤖 Suggest Priority`) | User clicks **Suggest Priority** | `title`, `description`, severity keywords | Form state (`priority`), warning if `UNKNOWN` |
| Natural Language Task Creation | Top of `Create Task` form (`🧠 Create Task Using AI`) | User clicks **Populate Form** | Free-text AI prompt | Form fields (`title`, `description`, `priority`, `dueDate`) before save |
| Duplicate Issue Detection | `Create Task` form submit flow | User clicks **Create Issue** | New issue `title`, `description`; existing task corpus (`title`, `description`, `status`, `priority`) | No DB write; warning UI + duplicate candidate list |
| AI Issue Categorization | Backend on create + optional direct endpoint | After successful task creation | `title`, `description` | `Task.category` |
| Root Cause Analysis | `Task Details` (`🔍 Analyze Root Cause (AI)`) | User clicks button | `title`, `description`, `category`, `comments[]` | `Task.aiRootCauseAnalysis` |
| Permanent Resolution Suggestions | `Task Details` under root cause (`💡 AI Suggested Permanent Resolution`) | Auto-runs after root cause analysis call | `title`, `description`, `category`, `rootCauseAnalysis` | Not auto-saved; user can save to `Task.resolutionNotes` |

## API Endpoints

- `POST /api/ai/summarize`
- `POST /api/ai/suggest-priority`
- `POST /api/ai/parse-task`
- `POST /api/ai/detect-duplicates`
- `POST /api/ai/categorize-issue`
- `POST /api/ai/root-cause`
- `POST /api/ai/resolution`

## Data Model

`Task` columns added:

- `aiSummary` (text)
- `category` (text)
- `aiRootCauseAnalysis` (text)
- `resolutionNotes` (text)

Also extended `TaskPriority` with `CRITICAL`.

## Security & Governance

All AI endpoints enforce:

- Authentication (Bearer token)
- CSRF validation (`x-csrf-token`)
- Input validation (Zod)
- API rate limiting (Redis-backed)
- AI request logging (structured logs)
- Response schema validation prior to write operations

## Confidence Badges

AI responses now include confidence metadata surfaced in UI:

- Summary confidence on `Create Task`
- Priority suggestion confidence on `Create Task`
- Parse confidence for natural-language task parsing
- Root-cause confidence on `Task Details`
- Resolution confidence on `Task Details`

## Async Processing

Issue categorization is processed in background mode after task creation:

- Queue path: BullMQ job `ai-categorize-task` when queue worker is enabled
- Fallback path: non-blocking in-process async categorization when worker is disabled

This reduces create-task latency and improves throughput.

## Admin Analytics

Admin insights are available at:

- API: `GET /api/admin/ai-insights`
- UI: `/admin/ai-insights`

Metrics include:

- Total task volume
- AI summary coverage rate
- Categorized issue count
- Root-cause analysis count
- Resolution notes saved count
- Resolution adoption rate
- Category breakdown and per-feature usage counts
