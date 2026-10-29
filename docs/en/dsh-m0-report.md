# M0: local DSH integration verification

Historical2026-10-28 report; English public edition,2026-10-29. Real pinned DSH passed basic synthetic-model integration. This did not verify cloud intelligence, encrypted memory, a voice safe word or computer use. Later native/speech checks are reported separately.

The adapter uses the official runtime and Node SDK`0.2.2-alpha.2`, a fresh explicit DSH home/workspace, a controlled environment and fixed synthetic credentials. Only loopback HTTP endpoints are accepted. Startup patches disable model-visible file and command tools rather than relying on persona instructions. A local mock exposes Messages and compatible Chat Completions routes.

The report recorded passing checks for receiving the prescribed reply through real DSH, SDK events/status, no advertised tools, restoration of the original session/context after closing and recreating a runtime,503error propagation, interruption of a hung reply without a false success, refusal of implicit restart, and discovery of a known plaintext synthetic marker in stored sessions. The last result demonstrates that encryption is not implemented; it is not a privacy certification.

A historical27ms SDK-close measurement concerns one local synthetic scenario with no external tool execution. It is not a guarantee for safe-word latency or every process. The later packaged stop check exercises a different controller scenario and must not be conflated with this number.

In this version, the official provider route used Messages at`/v1/messages`; it is not automatically an arbitrary Chat Completions gateway. A separate compatible route was tested. SDK session.event/status notifications and full message/stream records do not establish a finished token-by-token UI. Request timeout alone does not prove server-side cancellation; the adapter explicitly closes the runtime. Public Node interfaces were used rather than bypassing SDK constraints with private Python launch flags.

The integration tests create fresh synthetic directories and observe local identifiers/profile configuration plus session JSONL. No real identity, original artwork modification, cloud request or real token charge occurs. Image/attachment/shell/computer-use paths were not exercised, so their write locations still require separate investigation. The test environment initially blocked loopback subprocess connections; repeating in an environment permitting local networking did not require relaxing DSH's model-tool restrictions.

Reproduce from the repository root after installing`runtime/dsh`dependencies: `node tools/verify-dsh.mjs`. Important files are the DSH adapter/patches, `tests/dsh/integration.test.mjs`, local mock and verification script. Runtime outputs remain excluded from Git. Real provider configuration must be local; keys are never collected through chat or committed into examples.

Next work originally targeted native stop/UI and encrypted storage. Native UI and Windows system speech now exist, while real model integration and formal encrypted identity remain absent. Core-persona consent and recovery/termination precedence are still unresolved.
