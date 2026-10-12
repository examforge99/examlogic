# Native Android API and Authentication Contract Audit

**Status:** First-pass audit, not implementation approval  
**Audited backend ref:** `main` at production commit `85fc0df8c14d13a06342d1734345650a14a0ce2c`  
**Android work branch:** `feat/native-android-foundation`

## Decision

Do not wire the native app directly to the current API routes yet. The inspected routes use Clerk's server-side `auth()` and the app's Clerk middleware. The browser app currently relies on its Clerk session context. A native-compatible token issuance, validation, refresh, and sign-out contract must be confirmed and documented before the Android client calls protected routes.

Do not expose Supabase service-role/secret credentials in the Android app. Supabase remains behind the backend.

## Verified route entry points

| Capability | Route | Current behaviour observed |
|---|---|---|
| Quick Fire creation | `POST /api/sessions/quick-fire/start` | Authenticates with Clerk; server chooses 20 questions and a 15-minute duration; rejects an existing pending/active session; creates the session and attaches questions. |
| Quick Fire final submission | `POST /api/sessions/quick-fire/[id]/submit` | Authenticates with Clerk; checks session ownership, mode, and active status; accepts an `answers` array; returns a score summary and marks the session submitted. |
| Campaign creation | `POST /api/sessions/campaign/start` | Authenticates with Clerk; accepts subject/topic/count requests and optional time limit; server validates limits and creates the mode-specific session. |
| Campaign answer/submit | `POST /api/sessions/campaign/[id]/submit` | Supports single-answer and bulk submission paths. It uses the shared answer operation for individual answers. |
| Simulation creation | `POST /api/simulation/start` | Authenticates with Clerk and delegates creation to the simulation pipeline. |
| Active simulation lookup | `GET /api/simulation/session/active` | Returns the current pending/active simulation for the authenticated user, if present. |
| Sudden Death creation | `POST /api/sessions/sudden-death/start` | Authenticates with Clerk and creates the dedicated one-question-at-a-time mode state. |
| Sudden Death answer | `POST /api/sessions/sudden-death/answer` | Authenticates with Clerk and requires session ID, selected option ID, and current question nonce. |

This is not yet a complete endpoint inventory. Session restore, question retrieval, heartbeat, termination, scoring, and result routes still need to be traced for every mode.

## Native client requirements

1. **Server-owned rules:** Android must not authoritatively choose scoring, correct answers, session lifecycle, question membership, timing rules, or mode configuration.
2. **Durable local capture:** persist each answer and its timing to Room before showing it as safely captured.
3. **Batch survives network failure:** failed requests keep the exact batch locally pending. Retry must not erase or silently replace answers.
4. **Idempotent server reconciliation:** retrying the same batch must not create duplicate attempts, double-score, or produce conflicting session state.
5. **Restore:** after app process death or device restart, recover the local session snapshot and reconcile it with the server's authoritative session.
6. **Mode-specific semantics:** share identity, ownership, persistence, and safety invariants without flattening Quick Fire, Campaign, Simulation, and Sudden Death into one behaviour.
7. **No secret credentials in the app:** service-role keys and other backend secrets must never ship in the APK.

## Concrete concerns found during inspection

### 1. Authentication contract is not yet native-ready

The inspected route handlers call Clerk's server-side `auth()`; the root middleware also calls Clerk auth and rejects unauthenticated API requests. A browser cookie must not be assumed to exist in a native HTTP client. Confirm the supported Clerk native flow and how its session token is verified by the existing Next.js backend before implementing Android sign-in or API calls.

### 2. Quick Fire batch submission needs an idempotency/reconciliation design

The current Quick Fire submit route bulk-updates answer rows with `Promise.all`, but it does not inspect each update result before proceeding. It logs an attempts-insert failure and continues, then calculates the summary from the submitted request and marks the session submitted. This means a partial persistence failure can leave stored answer rows, attempts, and the final summary out of agreement.

The native client must still be allowed to submit its complete locally persisted batch when individual earlier network writes failed. Do **not** solve that by making each individual answer write a prerequisite for final batch submission. Instead, the server batch operation needs explicit idempotency and reconciliation semantics, with final results derived from authoritative persisted state.

The current route also does not visibly enforce a batch idempotency key, and it does not reject duplicate question IDs in the submitted array before computing the score. These require a deliberate backend contract change, not a client-side workaround.

### 3. Shared single-answer operation has a multi-write consistency gap

The shared answer operation updates `exam_session_questions` and then inserts an `attempts` row. An attempts insert error is logged rather than returned as a failure. A successful answer response therefore does not prove that the analytics attempt row was persisted. Define how retries repair this without duplicating attempts.

### 4. Session guard fails open in the audited main revision

The currently audited `src/lib/engines/shared/session-guard.ts` returns `false` when its query errors. A database error can therefore be interpreted as “no active session.” This is a backend safety issue to address and test separately before relying on the guard as the only protection against parallel sessions. Do not assume a database unique constraint exists until the production schema is verified.

## Next audit steps

- Trace the complete request/response and lifecycle for each mode, including resume, heartbeat, submit, terminate, score, and results.
- Inspect Clerk's supported native Android token flow and establish the server-side verification contract.
- Verify actual production database constraints and migration history before designing idempotency keys or new columns.
- Specify the Room schema only after the payloads and state transitions are mapped.
- Add contract tests for network loss, process death, replayed batches, concurrent submission, duplicate IDs, partial writes, session expiry, and cross-user access.

No backend routes, database schema, production settings, or the `main` branch were changed as part of this audit.
