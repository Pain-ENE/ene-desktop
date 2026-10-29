# Implementation plan around DSH

Historical2026-10-28 plan; English public edition,2026-10-29. The original reported that upstream investigation was complete but dependencies/runtime/desktop were not installed. Current synthetic integration and native progress supersede that status. Early Python/Qt proposals were replaced by the actual Electron/Node prototype.

## Route

Keep the ENE presentation, persistent identity, encrypted memory and governance separate from a replaceable DSH execution layer. Prefer official SDK/plugin interfaces and small necessary patches over rebuilding the entire agent loop or deeply converting the upstream work-assistant UI. Replacing DSH must not itself create a new identity.

The upstream baseline is commit `f3803c96974ad4a94195fb97e5c637e9c2a3afe3`, version`0.2.2-alpha.2`, recorded in `DSH_UPSTREAM.json`. The private shallow/sparse review checkout is not distributed here. Upstream declared Node>=24.9.0 and pnpm11.28.5; do not change unrelated global tooling to satisfy one project. Current published code uses npm lockfiles for the selected packages.

## Investigated interfaces and limits

SDK/headless operation avoids UI automation of the upstream client. Session restoration, requests, notifications, cancellation and process exit need tests, not assumptions. The persistence service is replaceable in upstream source, but append acceptance is not equivalent to durable flush. Encryption must preserve ordering, single-writer, recovery and durability semantics.

The minimal profile is not inherently a permissionless chat sandbox: inspect and explicitly disable file/shell/working-directory tools. Attachments, caches, spill and diagnostic outputs can outlive a session; a session-encryption provider alone does not cover them. Public interfaces should be preferred to private launch switches.

## Boundaries

- Presentation: transparent character, expressions, bubbles, settings and user input; no competing agent loop.
- Identity/memory: formal birth, encrypted storage, facts, persona versions, governance, recovery and sync; DSH session IDs are not permanent identity.
- Runtime adapter: controlled startup, limited context, events, requests, cancellation and isolation from existing user DSH settings.
- ENE plugins: authorized memory projection and proposals, never unrestricted master-key/persona modification.
- Stop controller: owns managed process trees and execution permission; remains effective when chat/model work hangs.
- Speech: replaceable backend with privacy-aware caching; device-specific Windows/Mac validation.

## Milestones

**M0, isolated DSH verification:** synthetic data and loopback model first, then a real-provider request only after local credential configuration. Validate handshake, state/events, session restore, errors, cancel and process cleanup. Inventory tools and every write location. Do not enable shell/computer use merely because the profile is called minimal.

**M1, native character and stop:** display, drag/scale, tray/menu bar, settings, bubbles and independent stop. Voice safe-word comes after local audio input. Deliver an honestly labeled prebirth EXE, not a claim that identity protections are complete.

**M2, encrypted disposable identity:** cover sessions, long-term memory, attachments, screenshots, request caches, spill and diagnostics. Verify password creation/unlock, wrong-password refusal, atomic persona/event updates, export/recovery, forced termination and corruption. Search test directories for deliberately planted private markers outside authorized ciphertext stores.

**M3, real persona and growth:** versioned persona projection, scoped retrieval, context compaction preserving identity/corrections/sources, three change routes and visible records. Do not turn unresolved proposals into final code authority. Validate multi-turn behavior, canceled requests and truthful task results.

**M4, speech and Mac:** authorized references, same-text auditions, interruption/private-cache checks, optional offline safe-word linkage. Validate arm64 packaging, window behavior, restoration and MLX on real hardware; Windows results do not establish Mac support.

**M5, synchronization and advanced capabilities:** add one backend and independent backups after stable identity/events. Grant computer use per task/application. Refusal/exit can precede deletion. Irreversible deletion, if adopted, requires resolved authority/backup semantics and disposable synthetic tests, never a generic arbitrary-file tool.

The first demo should establish whether DSH starts, communicates, stores where expected and stops reliably, before full desktop control or destructive capability. The current local demo intentionally uses fixed synthetic replies rather than claiming real intelligence.

## Publication

Keep ENE-authored code distinct from upstream, preserve dependency notices and version locks, and exclude keys, private memories and artwork/voices without redistribution permission. An official governance principle cannot make all forks technically immutable.

Historical references: [DSH architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md), [persistence](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/persistence.md), [upstream](https://github.com/deepseek-ai/deepseek-harness). See current progress for what actually passed.
