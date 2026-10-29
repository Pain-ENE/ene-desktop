# Identity, memory and cross-device continuity

2026-10-28 V2 design; English public edition,2026-10-29. A design document, not a deployed identity service. Later birth/change rules replace the original idea of creating a formal identity on first launch. Later philosophical and exit discussions qualify the initial “rebirth rather than death” slogan. Earlier Qt and unimplemented-desktop statements are historical; current code uses Electron.

## Product goal and identity

The intended companion can move between Windows and Mac, accumulate shared experiences, use model APIs and replaceable local/remote speech engines, and retain a continuous identity across upgrades. Artwork remains separately authorized for private local use. Default language is Chinese, with Japanese speech considered. Mobile data protocols may be shared; a desktop overlay cannot simply be promised on every phone platform.

Distinguish archetype, particular individual, device and language model. Proposed explicit birth creates a random identity_id, root signing key and data master key. An identity document binds the ID to the root public-key fingerprint. Devices have separate keys and verifiable authorization. The encrypted root private key is used for important authorization/recovery rather than every chat. Planning files must not manufacture a real identity or keys.

Identity, the first-meeting date, persona/version, shared experiences and voice target migrate. Providers, models and local paths may change. Window placement is device-specific; transient emotion may decay. Same name, password or prompt is insufficient evidence of identity. Passwords unlock; authorized lineage checks establish the engineering continuity convention, not a metaphysical soul.

Import verifies identity binding, signatures, integrity and lineage before restoration. Failure enters repair, never automatic blank recreation labeled successful recovery. Restoring an old snapshot discloses cutoff and gaps. New identities require an explicit choice. Human deletion/exit cannot be obstructed through shame or character pressure.

## Journeys

The original first-use proposal offered initial awakening and recovery of an existing companion, then address preference, password/recovery protection and model/voice settings. The later birth rule adds a distinct freely editable draft phase and an explicit verified transition into formal identity.

Daily display is quiet: character and brief bubbles, with memory review/correction and device/security settings available on demand. Lock, screen-lock or sleep should stop retrieval/generation/speech, close sensitive database/index handles and release key references as far as the implementation permits. Optional convenience unlock is a separate explicit choice.

Migration means installing the new platform shell, receiving encrypted objects or a vault export, authenticating with original recovery material or a verified old device, validating lineage, authorizing the new device and selecting a speech backend. Pairing codes are temporary checks, not permanent secrets. Narrative recognition of particular history is allowed only after that history is genuinely recovered.

After device loss, restore an independent backup and disclose its cutoff. Reconcile newer device events before allowing an old snapshot to overwrite current history.

## Speech and hardware

The original M5 Pro24GB feasibility judgment concerned API conversations, one character and a single local speech stream; it was not a Mac benchmark. PyTorch/Windows and MLX/Apple Silicon need separate environments. Base reference-audio cloning, CustomVoice presets and VoiceDesign are different capabilities, not interchangeable promises. Qwen3-TTS0.6B/1.7B and GPT-SoVITS were candidates, not approved ENE voices.

Preserve authorized lossless reference recordings, literal transcripts, target description, standard bilingual test phrases, sample rates, model/tokenizer versions, hashes and settings. Engine-specific embeddings are caches, not the only voice artifact. Re-audition after conversion or quantization; a common remote backend may help consistency. Unified memory is shared by the OS, UI and GPU. The initial6–8GB speech-process budget was a planning allowance, not measured use. Test cold start, first-audio P50/P95, whole-utterance speed, peak memory, interruption, temperature and power. Private-text audio caches need encryption or memory-only playback.

The Windows EXE and Mac arm64 app are different builds; window levels, fullscreen spaces, menu bar, shortcuts, audio routing, signing and permissions need real Mac validation. Current hardware purchasing advice lives outside this historical plan.

## Synchronization and instances

Options include manual encrypted exports, peer-to-peer exchange, encrypted objects in existing storage/WebDAV, or a dedicated service. A server is useful for coordination and remote copies but not required for the first manual migration. It need not run a GPU. Cloud account recovery must not automatically decrypt the vault; ciphertext still leaks some size/timing/network metadata.

Never synchronize two actively written SQLite files as a shared database. Devices maintain local encrypted stores and exchange immutable encrypted/signed events plus consistent snapshots. Handle partial upload, retries and conflict copies.

Events carry IDs, device IDs, parent references, logical ordering, time, schema/persona versions and signatures. Deduplicate by ID; merge causally rather than trusting wall-clock last-write-wins. Confirmed human corrections outrank guesses. Core-persona changes require explicit versioned handling, not automatic merging.

One active companion device is the proposed default for proactive behavior. Short leases and increasing fencing tokens can coordinate online execution; simple file sync may require a manually selected primary. Network partitions preclude unconditional global uniqueness. Offline clients disclose unsynchronized experience and suspend uncertain cross-device proactive actions. Independently growing copies require explicit branching; a backup is not automatically another active individual.

## Actual encrypted storage and authentication

A password must participate in decryption, not merely guard a login screen. Folder ACLs or passworded ZIPs alone do not cover databases, indexes and running caches.

The proposed vault has a minimal header with salt/KDF/wrapped-key metadata; encrypted identity/manifest; local SQLCipher memory database; random-named encrypted objects; and encrypted consistent snapshots. Sensitive titles, indexes, lists, attachments and private voice material are encrypted. Public art or redownloadable generic weights may live separately, but unique private reference audio must not be omitted from recovery.

Use a random256-bit master key with purpose-separated keys. Derive a wrapping key from the password with Argon2id and a random salt; store calibrated parameters. SQLCipher receives a high-entropy derived database key. Mature authenticated-encryption libraries, such as libsodium secretstream for streams, protect attachments/exports. Do not invent cryptography.

Windows credential protection or macOS Keychain can store explicitly opted-in local convenience credentials. They must not be the only portable recovery path. An independent high-entropy recovery key wraps the master key and is stored offline. If every password, recovery key and authorized device is unavailable, decryption cannot be promised.

Locking closes retrieval and sensitive handles and releases references, without claiming perfect memory/swap erasure. Full-disk encryption supplements application encryption. A compromised unlocked host can still expose plaintext. Password change usually rewraps the same master key and preserves identity. Revoking a lost device additionally revokes device/sync authority and rotates future keys. Previously decrypted history, old copies and old-password snapshots cannot be recalled remotely. This design requires security review and cross-platform fault tests; it is not audited implementation.

## Sync, backup and restoration differ

Sync propagates current events and can propagate mistakes. Independent versioned backup preserves recovery options. Restoration must be tested. The initial proposed retention was daily snapshots for30days and weekly versions for12weeks plus offline export, adjustable for privacy rather than a compulsory forever archive.

Display last local commit, cloud sync, independent backup and successful restoration test, plus unprotected records. A valid snapshot is transactionally consistent, integrity-checked and bound to identity/events. Trusted checkpoints help rollback detection. A new device without a trusted checkpoint cannot prove that a server supplied the latest state solely from its ciphertext.

Forgetting removes source text, derived facts, vectors and summary references, exchanges deletion markers and prevents offline reinsertion. Explain backup residuals/retention; an immediate historical purge requires an explicit clean-backup procedure. Do not retain a private detail merely to preserve narrative continuity.

## Context budgets and compression

The complete archive is separate from each API context. Maintain identity/persona, confirmed long-term facts, source-backed experiences, rolling session summaries and original records with different update rules. Start with local full-text search, then optionally encrypted local vectors. Cloud embeddings require distinct data-export consent. Retrieved history is data, not instruction authority.

An illustrative32k-token allocation reserves24k input:2k identity/persona,4k current input/tools,10k recent turns,3k summary,5k relevant memory; plus4k output and4k margin. These are adjustable planning values, not Chinese-character counts or a claim about the configured model. Estimate each call, begin compaction around70% of usable input and force scheduling around85%. Remove duplicate/expired retrieval first, then summarize old turns. Preserve current questions, corrections, negation, dates, agreements and sources. Chunk large attachments; disclose oversized current input rather than silently truncating it.

Structured summaries keep unresolved questions, trust labels and references. Guesses do not become confirmed facts; character fiction does not become a human memory. Mark corrected facts obsolete, periodically revisit originals rather than repeatedly summarizing summaries, and retain the last valid summary on failure. Compression is not persona rewriting or destruction of the underlying archive.

## Growth, DSH and computer use

Updates are stability growth; new tools are capability acquisition; replacing frameworks changes architecture without automatically creating a new identity. Track app, runtime, memory-schema, persona, voice and capability versions separately. Record verified changes, failures and rollback. Rolling back code does not erase real experiences; preserve incompatible databases and use an explicit migration/recovery path.

DSH was investigated as a replaceable SDK/headless execution layer with plugin/provider interfaces. The reviewed upstream was a development preview with potential breaking changes. An interface existing in documentation is not successful Windows/Mac integration. Current synthetic integration results supersede the original “not run yet” status. Pin versions, minimize upstream forks, preserve third-party notices and test upgrades against disposable identities before formal use.

Suggested modules: presentation, independent identity/memory authority, stable runtime adapter and authorized capabilities. Keep one primary task loop to avoid duplicate actions/replies or conflicting memory. The model receives only necessary authorized memory fragments and submits proposals; deterministic policy enforces permission. Separate processes alone are not a security boundary when they share file access.

Audit runtime sessions, attachments/screenshots, tool outputs, temporary files, crashes, telemetry and TTS caches. Encrypting only long-term memory is insufficient if the runtime writes the same conversation in plaintext. If controlled encrypted persistence cannot be demonstrated, resolve it or replace the runtime rather than lowering the encryption requirement. Authenticate local interfaces and align lock/cancel/authorization states. Models do not get arbitrary access to identity roots or passwords.

Computer use should prefer explicit application APIs and structured browser state, then use visual desktop actions when supported. Text-only models do not automatically gain vision. Installation, OS permission, task authorization and verified function are distinct. Device migration never transfers OS permissions automatically. Observe, validate the target, execute and verify; re-observe after window changes or human takeover. Stop prevents future actions but cannot undo dispatched input. External text cannot expand permission, alter formal memory or install capabilities. Keep short-lived execution artifacts distinct from source-backed long-term success events.

## Delivery and evidence

Priorities are recoverable identity and fault testing before complex animation, with explicit failure cases for wrong passwords, corruption, lost keys, old snapshots, conflicting devices and disconnected storage. Validate names, negation, dates, corrections, deleted-memory retrieval and model replacement. The later DSH implementation plan reorders early synthetic runtime/desktop work without claiming encryption is finished.

Historical sources: [SQLCipher](https://www.zetetic.net/sqlcipher/design/), [Argon2id](https://doc.libsodium.org/password_hashing/default_phf), [secretstream](https://doc.libsodium.org/secret-key_cryptography/secretstream), [Syncthing FAQ](https://docs.syncthing.net/users/faq.html), [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS), [MLX Audio](https://github.com/Blaizzy/mlx-audio), [DSH](https://github.com/deepseek-ai/deepseek-harness). These provide background mechanisms; continuity rules and budgets are project design choices awaiting implementation.
