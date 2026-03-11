# AI Document — AI Features Used in Task Platform

This document lists the AI features currently used in the project and where they are used.

## 1) Smart Task Summarization

- **Purpose**: Generate a concise issue summary from title + description.
- **Used in UI**: Create Task flow and Task Details analysis flow.
- **API**: `POST /api/ai/summarize`
- **Typical output**: `summary`, confidence metadata.

## 2) Natural Language Task Parsing

- **Purpose**: Convert free-text user input into structured task fields.
- **Used in UI**: `Create Task Using AI` action.
- **API**: `POST /api/ai/parse-task`
- **Typical auto output**: `title`, `description`, `priority`, optional `dueDate`, `Team` confidence metadata.

## 3) AI Priority Suggestion

- **Purpose**: Suggest suitable task priority based on issue content.
- **Used in UI**: Priority assist on Create Task page.
- **API**: `POST /api/ai/suggest-priority`
- **Typical output**: suggested priority + explanation/confidence.

## 4) Duplicate Issue Detection (AI-assisted)

- **Purpose**: Identify similar existing issues before creating a new task.
- **Used in UI**: Create Task submit flow.
- **API**: `POST /api/ai/detect-duplicates`
- **Typical behavior**: fast lexical pre-check + optional semantic AI scoring.

## 5) AI Issue Categorization

- **Purpose**: Classify newly created tasks into useful categories.
- **Used in Backend**: after task creation (async/background path where configured).
- **API**: `POST /api/ai/categorize-issue`
- **Typical output**: category label for task analytics and triage.

## 6) Root Cause Analysis

- **Purpose**: Generate likely root causes using task details + comments context.
- **Used in UI**: Task Details modal/page analysis action.
- **API**: `POST /api/ai/root-cause`
- **Typical output**: root-cause analysis text/structure with confidence metadata.

## 7) Permanent Resolution Suggestions

- **Purpose**: Suggest prevention and long-term fix actions based on root cause.
- **Used in UI**: Task Details follow-up action after root cause analysis.
- **API**: `POST /api/ai/resolution`
- **Typical output**: mitigation/prevention action plan with confidence metadata.

---

## AI Provider Strategy Used

- **Primary development strategy**: local-first mode (`AI_FALLBACK_PROVIDER=local`)
- **Supported fallback providers**: hosted providers (Gemini/HuggingFace) when configured
- **Local runtime**: Ollama-compatible endpoint via `LOCAL_LLM_API_URL`

This strategy keeps AI features available even when hosted providers are rate-limited or unavailable.

---

## Admin AI Visibility

- **Admin API**: `GET /api/admin/ai-insights`
- **Admin UI**: `/admin/ai-insights`
- **Metrics shown**: feature usage/adoption and category-level AI analytics.

---

## Security and Guardrails Applied to AI Endpoints

- Authentication required
- CSRF checks
- Input validation
- Rate limiting
- Output normalization/validation before persistence

These controls ensure AI features remain safe, predictable, and production-friendly.
