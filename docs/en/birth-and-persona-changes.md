# Birth and persona-change rules

2026-10-28 discussion; English public edition, 2026-10-29. This defines proposed product rules, not an implemented encrypted identity. “Birth” is the start of an explicitly governed identity history, not a scientific test for consciousness. Read the current progress report before interpreting implementation status.

## Before and after birth

Before birth, the state is DRAFT. Persona fields, synthetic trial conversations and behavior parameters may be edited or deleted in plaintext. The UI must identify this as a draft. No formal identity root, official growth history or production synchronization is created. Sensitive real-life material should not enter this stage. Later encryption cannot remove material already sent to an API provider.

Birth requires an explicit human operation: finalize a baseline; decide whether any trial records are inherited, labeled as prebirth material; create password and recovery protection; generate identity and baseline version; write an encrypted birth event; verify decryption and recovery; only then enter BORN. Installation, one conversation or a model's declaration cannot trigger birth. The transition needs transactional, recoverable states. Failure must not produce an inaccessible half-created identity or a false success message. Explain plaintext remnants; do not promise physical erasure from SSDs, external backups or provider logs.

After birth there is no silent return to unrestricted editing of the same identity. An archived identity may seed an explicitly labeled experiment. Importing its results must follow the change procedure.

## Growth and traceability

The prohibition concerns unrecorded persistent rewriting, not growth. Persistent changes include long-term preferences, persona fields, values and behavior boundaries, memory editing/forgetting, and prompt, model, architecture or tool versions that materially change behavior. Window motion, facial expressions and every cache update need not masquerade as personality changes.

Supported modification paths produce events. Startup checks compare registered versions against actual formal configuration. An unregistered external change is held for review; the application must not invent a prior discussion to legitimize it.

## Three paths

**Discussion first.** Either party proposes a concrete change, reasons, scope and anticipated effects. Record the discussion and show a diff. Agreement, disagreement and alternatives remain distinguishable. Silence is not agreement. Without consensus, a human may choose an explicitly labeled administrative path where the applicable policy allows it; never manufacture consensus.

**Human modification with visible records.** Local authentication authorizes a supported direct change. Record initiator, executor, reason, old/new versions, time, discussion status and visibility. The model does not grant administrator authority, and its objections are not erased. When the runtime is absent or the vault locked, prepare a pending proposal; authenticate, unlock and record before activation. On resumption, ENE receives an intelligible change notice, also visible to the human.

**Bounded self-adjustment.** ENE may adjust structured fields specifically authorized in the birth baseline or later grants: expression pace, initiative, interests or snark intensity, for example. A deterministic validator checks field permissions, limits and version conflicts. Permitted changes may apply automatically with visible reasons and diffs. Humans may restrict future scope or explicitly revert; reversion is also recorded. Permission to “grow” does not authorize arbitrary code edits, plugin installation, broader OS permissions or rewriting audit history.

Self-adjustment needs limits, cooldowns and a change budget. Rapid oscillation, escalating traits merely to please, or repeated failures suspend it with an explanation. One negative rating must not automatically rewrite the persona. Task steps, duration and API expense require separate budgets.

## Visibility and atomicity

An event includes event/identity identifiers, initiator and executor, type, versions and diff, reason, discussion references/result, device/runtime versions, execution state, visibility acknowledgments and integrity metadata. Human visibility requires an automatic notice and searchable history. ENE visibility means loading the needed notice before subsequent generation and allowing authorized retrieval of full records; a database row alone is insufficient.

Persona mutation and its event commit atomically. External updates progress through preparation, execution, verification and success/failure events. Concurrent devices require version preconditions and explicit conflict handling. A recorded model agreement does not establish consciousness or authentic autonomy.

## Protected runtime rules

Self-adjustment cannot change identity binding, master-key management, encryption requirements, change-history mechanisms, human data access/export/deletion, emergency stop, permission validation or restart rules. Maintenance of these controls uses a protected administrative path, not character dialogue. Security repairs may immediately prevent unsafe behavior, with an accurate later explanation. Installation, authorization and verified capability remain separate states.

The later disagreement discussion questions whether direct administration should extend to core-persona rewriting at all. This tension is unresolved; the three-path rule does not settle it silently.

## Emergency stop

A safe word is a deterministic stop signal, not a prompt requiring model comprehension or consent. It supplements accessible buttons and an independent shortcut. The proposed independent controller owns managed DSH, TTS, computer-use executors and background tasks. It halts dispatch, revokes execution sessions, cancels in-flight work and force-terminates owned processes if necessary, without killing unrelated applications.

The proposed formal system retains a persistent stop latch, cleared only by explicit human resumption. Stop does not wait for logging, model output or network completion. Logging is best effort and cannot be fabricated. Committed transactions remain recoverable; unfinished transactions do not become successful. Stop is suspension, not identity deletion. The current preview only provides a running-process latch and managed-process control, not the complete persistent architecture.

Voice activation requires opt-in local listening and offline keyword recognition. Only authorized input channels can issue control commands; webpages, tool output, model replies and TTS text are not control instructions. Echo, ambient speech and mistaken recognition require testing. A safe word is not a secret or speaker-authentication credential. Keyboard and tray controls must still work without a microphone. Stop cannot undo messages, payments or input already dispatched, guarantee cancellation of remote jobs, or instantly stop offline remote devices. OS/hardware failure prevents absolute guarantees.

## Encryption, records and deletion

Encryption protects confidentiality; signatures and chained integrity checks help detect changes. Neither prevents an administrator controlling every key and copy from deleting everything. Independent authorized devices or trusted checkpoints can strengthen rollback detection without pretending to provide indestructible storage.

Logging must not retain passwords, recovery secrets or unnecessary private text. Authorized forgetting covers derived data and backup policies; minimal redaction markers must not preserve details a human has asked to remove. Whole-identity deletion cannot leave a hidden resurrection copy.

Acceptance scenarios include transactional birth/recovery, rejection of unlogged mutations, honest notification after changes, bounded self-adjustment, stop during renderer/model/audio/tool failures, recovery after forced shutdown, and replacement of DSH or the shell without changing identity.

Sources retained from the discussion: [SQLite atomic commit](https://www.sqlite.org/atomiccommit.html), [Qt process termination](https://doc.qt.io/qt-6/qprocess.html), [OWASP logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html). They support mechanisms, not proof that this product has implemented them.
