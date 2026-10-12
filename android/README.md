# ExamLogic Android

A separate native Android client for ExamLogic, built with Kotlin and Jetpack Compose. This project lives under `android/` so it remains isolated from the existing Next.js client and can be extracted into its own repository later without redesigning its package structure.

## Architecture boundaries

- **Android UI:** Jetpack Compose. UI state is presentation state, not the durable record of an answer.
- **Local persistence:** Room/SQLite will own durable session snapshots, selected answers, and pending submission batches. The exact schema is intentionally deferred until the existing session contracts and mode-specific behaviour are mapped.
- **Sync orchestration:** retries and reconciliation must be idempotent. A temporary network failure must not discard a locally saved answer or pending batch.
- **Backend authority:** the existing Next.js API and Supabase/Postgres remain authoritative for identity, question membership, accepted answers, session lifecycle, scoring, and results.
- **Authentication:** reuse the existing identity system through an Android-compatible, explicitly verified authentication flow. Do not copy browser cookie assumptions into the Android client.
- **Mode behaviour:** Quick Fire, Campaign, Simulation, and Sudden Death retain their documented differences. Share invariants, not behaviour.

## Non-negotiable answer-capture rule

The UI must not report an answer as safely captured until the local database write succeeds. Submission must operate on the persisted batch, not merely the current Compose state. A failed network request leaves the batch pending for retry. Server writes and attempt creation must be idempotent so replay does not duplicate results.

SQLite is local recovery storage, not the authority for scoring or final results. Local storage can still be lost if app data is cleared or the device fails, so persistence errors must be visible rather than silently ignored.

## Current scope

This is the native app foundation only. It does not yet implement sign-in, session APIs, the Room schema, offline synchronization, exam modes, or production styling. Those should follow the architecture and API audit rather than be guessed into existence.

## Build

Open the `android/` directory in Android Studio with a compatible Android SDK installed. The Gradle wrapper is not included in this initial scaffold, and the project has not yet been built or tested.
