# How ENE connects to DSH

English public edition,2026-10-29. This describes implemented code, not future capabilities. The Chinese source predates the latest system-TTS work; current speech status is in the progress report.

ENE uses its own desktop interface with the official DSH SDK/runtime underneath. ENE owns character windows, static images, bubbles, input and poses. It does not clone or deeply modify the upstream DSH desktop client, so visual resemblance is not expected.

Actual chain:

```text
React UI → restricted IPC → Electron main-process RuntimeController
→ standalone Node24.21.0 worker → official DeepSeekHarness SDK
→ DSH0.2.2-alpha.2 sdk-minimal → compatible llm-pi-ai route
→ loopback HTTP synthetic model
```

The runtime starts when an example message is sent, rather than launching the official client on application startup. Settings show engine version and worker state.

`native/runtime-worker.mjs` sends a fixed synthetic marker, **not the user's message**. After real DSH returns`ENE_SYNTHETIC_OK`, the UI receives a canned Chinese reply. This verifies dependencies, protocols, processes, errors and stopping; it does not verify model intelligence. User input/history live only in the current chat renderer's memory. Synthetic runtime sessions are plaintext and are not formal identity records.

Real provider integration needs verified endpoint/protocol/model/context limits and secure local credentials, then deliberate projection of persona and authorized memories. Changing a connected label would not implement these capabilities. Encrypted long-term memory, real persona-aware conversations and computer use remain absent; system speech was added later independently.

Idle/seated/prone are separate static assets selected by the user or the bounded rest scheduler. Window perching uses the seated slot. No blink, walk or model-directed action system is implemented. Future model actions need constrained commands, not arbitrary window/system operations.

Key code: `apps/ene-desktop/native/main.mjs`, `controller.mjs`, `runtime-worker.mjs`, and `adapters/dsh/runtime.mjs`. No key should be supplied through an issue, chat or tracked configuration.
