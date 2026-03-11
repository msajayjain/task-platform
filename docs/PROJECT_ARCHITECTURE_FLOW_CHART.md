# Project Architecture Flow Chart

This document provides a visual architecture flow for Task Platform.

---

## 1) End-to-end architecture flow (system view)

```mermaid
flowchart LR
  U[User Browser] --> W[Web App<br/>apps/web]
  W -->|/api via rewrite| APIGW[API Proxy Target]
  APIGW --> A[API App<br/>apps/api]

  A --> M1[Auth / RBAC / CSRF / Rate Limit]
  M1 --> C[Controllers<br/>presentation/controllers]
  C --> S[Application Services<br/>application/services]
  S --> R[Repositories<br/>infrastructure/repositories]

  R --> DB[(PostgreSQL<br/>Prisma)]
  S --> RC[(Redis)]
  S --> Q[BullMQ Queue]
  S --> AI[AI Service Adapter]

  AI --> LLM1[Local LLM<br/>Ollama-compatible]
  AI --> LLM2[Hosted AI Providers<br/>Gemini/HuggingFace]

  Q --> WKR[Background Worker/Job Processing]
  WKR --> DB
```

---

## 2) Request processing flow (runtime view)

```mermaid
sequenceDiagram
  participant User
  participant Web as Web UI (apps/web)
  participant ApiRoute as API Route (apps/api/app/api)
  participant Ctrl as Controller
  participant Svc as Service
  participant Repo as Repository
  participant DB as PostgreSQL
  participant Redis as Redis
  participant AI as AI Provider

  User->>Web: Action (create/update/analyze task)
  Web->>ApiRoute: HTTP /api/*
  ApiRoute->>Ctrl: Delegate request
  Ctrl->>Ctrl: Validate + auth + policy checks
  Ctrl->>Svc: Call business logic
  Svc->>Repo: Read/write model data
  Repo->>DB: SQL via Prisma
  Svc->>Redis: cache/rate-limit/queue support
  alt AI-assisted path
    Svc->>AI: summarize/parse/root-cause/resolution
    AI-->>Svc: normalized response
  end
  Svc-->>Ctrl: domain result
  Ctrl-->>Web: standardized API response
  Web-->>User: updated UI state
```

---

## 3) Layer legend

- **Web App**: user interface, forms, dashboards, admin screens.
- **API App**: route entrypoints for auth, tasks, AI, admin.
- **Controllers**: input validation, response shaping, middleware orchestration.
- **Services**: business rules and orchestration (including AI calls).
- **Repositories**: persistence boundary to PostgreSQL through Prisma.
- **Redis/BullMQ**: cache, rate limits, and async/background jobs.
- **AI Providers**: local-first AI with hosted fallback options.

---

## 4) Key architecture characteristics

- Clean layered backend for maintainability.
- Monorepo with shared types for API/Web consistency.
- Secure-by-default controls on protected endpoints.
- AI integrated as optional assistive capability, not a hard dependency.
- Async offloading for operations that should not block core UX.
