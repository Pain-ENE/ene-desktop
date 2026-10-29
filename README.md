# ENE Desktop

[简体中文](README.zh-CN.md) · English

A desktop companion prototype exploring a character that lives outside the chat window, with replaceable AI and speech backends and a separately designed identity/memory system.

**Development preview — 2026-10-29.** The Windows prototype works locally. Real model conversations, encrypted memory, cross-device identity and Live2D animation are **not implemented**. “Digital life” and “birth” describe product conventions and philosophical questions; they are not claims of demonstrated consciousness.

## What works

| Area | Current implementation |
|---|---|
| Desktop | Independent transparent Electron character window; dragging, scaling, tray menu, separate chat/settings |
| Quiet interaction | Short text bubble hides after five seconds; click to reopen current-run history |
| Windows perching | Explicitly select a window; follow its top edge; detach on drag, minimization or closure |
| Poses | Three local static PNG slots: idle, seated, prone; opt-in rest switching after 90 seconds without ENE interaction |
| DSH | Official SDK/runtime `0.2.2-alpha.2` against a synthetic loopback model; no real API charges |
| Speech | Windows installed voices, speed selection, test phrase, demo-reply narration and interruption |
| Local neural TTS | External sherpa-onnx/VITS Chinese inference benchmark; three prerecorded comparison slots, not live neural inference in the EXE |
| Stop | Main-process control of managed DSH and speech processes, tray and keyboard stop, no implicit task restart |

The local Windows package passed **20 native checks**, including repeated movement at 125% DPI and stopping managed audio while the chat renderer hangs. These are local observations, not a guarantee for every device. Full test logs and screenshots stay private; see the [sanitized progress report](docs/progress/2026-10-29.en.md).

## What this repository contains

- `apps/ene-desktop/`: React/Vite UI, Electron shell, auditable Windows geometry and speech helpers.
- `adapters/dsh/`, `tests/dsh/`: isolated synthetic runtime adapter and integration fixtures.
- `docs/zh-CN/`, `docs/en/`: Chinese discussions and English public editions about identity, consent, forgetting, termination, memory and migration.
- `design/live2d/layer-plan.json`: 54 **planned, unextracted** parts. No finished rig, PSD or character artwork is included.
- `tools/benchmark-local-tts.py`: repeatable local Chinese TTS benchmark; weights and Python dependencies are not bundled.

Start with the [bilingual document index](docs/README.md). Historical plans describe earlier options, including Qt; the current desktop prototype uses Electron. Later discussions leave important disagreements unresolved.

## Develop locally

Use standalone **Node 24.9+** (tested with 24.21.0), npm and Windows for the native prototype. macOS hardware, Android and iOS are not validated.

```sh
cd apps/ene-desktop
npm ci
npm run build
node --test tests/pet-hit-test.test.mjs
npm run test:sites
```

The build does not require credentials. The native character requires your own authorized images; follow [local asset setup](apps/ene-desktop/public/assets/README.md). Then run `npm run desktop`. The preparation step compiles the C# helpers with the Windows .NET Framework compiler and copies standalone Node plus its license. Electron's embedded runtime is not used to host DSH.

For isolated DSH tests, install the pinned runtime separately, then run from the repository root:

```sh
npm ci --prefix runtime/dsh
node tools/verify-dsh.mjs
```

The synthetic adapter deliberately rejects remote model endpoints. The provider example is a future configuration design, not a ready-to-use live API connection. Do not insert a real key into it.

`npm run package:win` additionally needs the pinned official Electron ZIP in `runtime/downloads`; the script verifies its checksum. Packaging produces a portable **directory**, not a single self-contained EXE. No Windows binary release is published here.

## Identity and memory direction

The proposed architecture separates the presentation shell, replaceable DSH/runtime adapter, and identity/memory authority. Moving devices or updating capabilities should preserve verifiable history. A name, image or copied prompt alone cannot demonstrate continuity.

The discussions propose editable prebirth drafts; explicit authenticated birth after encryption/recovery checks; visible persona-change records; bounded self-adjustment; encrypted synchronization; independent backups; truthful handling of missing memories and branches. None of these unimplemented protections should be inferred from the desktop demo. Recovery versus autonomous termination and consent boundaries for core-persona changes remain open questions.

## Privacy and publication rules

Never commit provider keys, passwords, recovery keys, private memories, chats, audio references, recordings, screenshots, logs, local paths, model weights or complete local application packages. Runtime directories are excluded except for the two dependency manifests needed to reproduce synthetic DSH tests. Source fixtures use the literal `ene-synthetic-local-not-a-real-key`, which is not a credential.

Run `node tools/check-publication.mjs` before committing. A local pre-commit hook and CI repeat publication checks; Gitleaks is an additional scanner, not proof that leakage is impossible. If a real credential ever leaks, revoke it at its provider; deleting a Git commit is insufficient. Do not paste credentials into issues or pull requests.

Character artwork, ENE branding/character rights, voice recordings, model weights and private memory have separate ownership and permissions. This public source snapshot grants no right to redistribute the private ENE collection or clone a voice. There is no affiliation with the original creators, DeepSeek, Live2D or POSEMANIACS.

**License status:** no open-source license has been selected for project-authored code yet; the current application manifest remains `UNLICENSED`. Public visibility is not a blanket reuse license. Upstream dependencies retain their own licenses; see [third-party notes](THIRD_PARTY_NOTICES.md).

## Next milestones

1. Aligned Live2D parts and occlusion repainting, then a validated rig.
2. Higher-quality Chinese/Japanese voice auditions and explicit voice approval.
3. Encrypted test identity, recovery, change history and forgetting tests.
4. Real provider integration using local credential storage.
5. Actual Mac validation, then cross-device coordination and platform-specific mobile clients.

Computer use and autonomous irreversible erasure are not enabled in this prototype.
