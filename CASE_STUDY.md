# Case Study: Xtractor

## Project Overview

**Xtractor** is a production-grade TypeScript application built to orchestrate high-throughput data extraction from a spreadsheet processing API. It handles S3 sync, parallel extraction, resumable checkpointing, scheduling, analytics, and email reporting — all exposed through both a CLI and a web dashboard.

This project was **100% built using AI agent orchestration** (Gemini/Claude agents), demonstrating how AI-driven development can produce enterprise-quality software with clean architecture, full type safety, and production resilience patterns.

---

## 1. Problem Statement

The target API processed spreadsheet files at varying rates under load. Manual extraction was impractical at scale: thousands of files needed to be synced from S3, submitted to the API in parallel, tracked per-run, and retried on failure — all without losing progress on interruption.

**Key requirements:**
- Pull files from S3 into local staging with integrity checks
- Submit files to the extraction API at configurable RPS with concurrency limits
- Track per-file status (pending / running / done / error / skipped) across resumable runs
- Generate P50/P95/P99 latency analytics and HTML reports per run
- Expose all of this via a web dashboard with real-time progress
- Keep all credentials out of code via Fernet-encrypted env vars

---

## 2. Architecture

The project strictly follows **Clean Architecture** — domain logic is fully isolated from infrastructure:

```
┌──────────────────────────────────────────────────────────┐
│                    CLI (index.ts)                         │
│                    Web Server (server.ts)                 │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  Adapters Layer                                           │
│  ├── controllers/  (HTTP request handlers)                │
│  ├── presenters/   (UI-ready data formatting)             │
│  └── router.ts     (zero-dep HTTP routing)                │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  Core Layer (pure business logic — no I/O)                │
│  ├── domain/       (entities, interfaces, types)           │
│  └── use-cases/    (SyncBrand, RunExtraction,             │
│                     ExecuteWorkflow, GetInventory…)       │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│  Infrastructure Layer                                     │
│  ├── database/   (SQLite via better-sqlite3)              │
│  ├── services/   (AWS S3, Nodemailer, Cron, Fernet…)     │
│  └── utils/      (metrics, path normalization, stdout)    │
└──────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Use cases depend only on **repository interfaces** — swapping SQLite for Postgres requires zero use-case changes.
- The web server and CLI both wire the same use cases — no logic duplication.
- No framework (Express, Fastify) — a custom zero-dependency HTTP router avoids unnecessary overhead at this scale.

---

## 3. Key Technical Features

### Parallel Extraction with RPS Control

Files are submitted concurrently using `p-queue`, with configurable concurrency and a token-bucket rate limiter keeping requests under the API's rate limit. Each file result is written to SQLite immediately — no in-memory accumulation.

### Resumable Checkpointing

Every run has a `run_id`. On interruption, the runner resumes from the exact last checkpoint: files with `status = done` are skipped, partials are cleaned up. This enables safe restart of million-file batches.

### SHA-256 Integrity on S3 Sync

The S3 sync layer computes SHA-256 of each downloaded file and compares it against the manifest. Already-present unchanged files are skipped — only new or changed files are downloaded.

### Fernet Encryption for Secrets

Credentials are never plain-text in `.env`. The `FernetSecretService` reads `*_ENCRYPTED` env vars, decrypts them with the `FERNET_KEY` at startup, and injects the plain values into `process.env` transparently. The app works equally with plain or encrypted secrets.

### Analytics: P50 / P95 / P99 Latency

After each run, `computeMetrics()` computes latency percentiles, throughput (files/sec), success rate, and error categorization from raw SQLite records using `simple-statistics`. These populate both the HTML report and the dashboard analytics tab.

### Web Dashboard (No Framework)

The dashboard is a single-page app served by the custom HTTP router, featuring:
- **Real-time progress bars** — synced via periodic polling
- **Historical run analytics** — latency charts from past runs
- **Scheduler UI** — cron-based job scheduling with persistent SQLite storage
- **Data Explorer** — browse per-file results and filter by status/brand/purchaser

### HTML Email Failure Reports

After each run, if any files failed, a professional HTML email is sent via Nodemailer/Gmail SMTP with:
- Run summary (success rate, duration, throughput)
- Per-failure detail table with file path, error message, HTTP status
- P50/P95/P99 latency summary

---

## 4. Testing

The project includes Vitest unit tests focusing on deterministic, infrastructure-free logic:

| Test File | Coverage |
| ------------------------------------ | ------------------------------------ |
| `utils.test.ts` | Path normalization, stdout parsing |
| `sync-brand.use-case.test.ts` | S3 sync orchestration logic |
| `run-extraction.use-case.test.ts` | Extraction pipeline, retry, skips |
| `execute-workflow.use-case.test.ts` | Full workflow orchestration |

All infrastructure dependencies are mocked — tests run in under 1 second with no network or disk I/O.

---

## 5. CI/CD

A GitHub Actions pipeline runs on every push:

```
quality-gate
  ├── TypeScript build check (tsc)
  └── Unit tests (vitest run)
```

The app intentionally has no E2E CI — it requires private API credentials. The pipeline validates compile-time correctness and all unit-testable logic.

---

## 6. Results

- ✅ 100% built by AI agents (Gemini/Claude orchestration)
- ✅ Clean Architecture — domain layer has zero infrastructure imports
- ✅ Processes thousands of files per run with resumable state
- ✅ P50/P95/P99 latency analytics generated automatically
- ✅ Fernet-encrypted secrets — no plaintext credentials in any file
- ✅ Zero-dependency HTTP router (no Express/Fastify)
- ✅ Full-featured dashboard: real-time progress, scheduler, analytics, export
- ✅ CI pipeline — TypeScript build + unit tests on every commit

---

## 7. AI Development Process

This project was built end-to-end using AI agent orchestration:

1. **Architecture design** — Agent proposed Clean Architecture layer separation based on requirements
2. **Domain modelling** — Entities and repository interfaces generated from use-case descriptions
3. **Infrastructure** — S3, SQLite, Nodemailer implementations written by agent, reviewed by human
4. **Dashboard** — Web UI components generated from design prompts, no frontend framework needed
5. **Refinement** — Human-in-the-loop review identified edge cases (resume logic, rate limiting) that were iteratively fixed

The result demonstrates that AI-assisted development can produce maintainable, production-quality code when paired with proper architectural guidance and human review.


