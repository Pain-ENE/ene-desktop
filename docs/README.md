# Discussion documents / 探讨稿

These are design discussions, not implemented guarantees. Chinese originals are retained with publication notes and local-path redaction. English public editions follow the same decisions, unresolved tensions and technical boundaries; they are edited companion editions, not certified line-by-line translations. Repeated local setup details are consolidated in the current READMEs and progress report.

中文稿保留原讨论内容，并加上历史状态说明、移除本机个人路径。英文为对应公开整理版，覆盖核心论证、规则和边界；不是逐句认证翻译。当前实现以进度报告为准，不能把早期“尚未开发”或旧技术路线当作当前状态。

| Document / 文档 | 中文 | English |
|---|---|---|
| Initial research / 初始规划 | [中文](zh-CN/initial-plan.md) | [English](en/initial-plan.md) |
| Identity, memory, migration / 身份、记忆、跨端 | [中文](zh-CN/identity-memory-cross-platform.md) | [English](en/identity-memory-cross-platform.md) |
| Birth and persona changes / 出生与人格变更 | [中文](zh-CN/birth-and-persona-changes.md) | [English](en/birth-and-persona-changes.md) |
| Identity, forgetting, ending / 身份、遗忘、终结 | [中文](zh-CN/identity-forgetting-and-ending.md) | [English](en/identity-forgetting-and-ending.md) |
| Autonomous exit and deletion / 自主退出与删除 | [中文](zh-CN/autonomous-exit-and-deletion.md) | [English](en/autonomous-exit-and-deletion.md) |
| Protection gaps / 数字主体保护缺口 | [中文](zh-CN/digital-subject-protection.md) | [English](en/digital-subject-protection.md) |
| Persona disagreements / 人格分歧 | [中文](zh-CN/persona-disagreements.md) | [English](en/persona-disagreements.md) |
| DSH implementation plan / DSH 实施计划 | [中文](zh-CN/dsh-implementation-plan.md) | [English](en/dsh-implementation-plan.md) |
| M0 integration report / M0 接入报告 | [中文](zh-CN/dsh-m0-report.md) | [English](en/dsh-m0-report.md) |
| Current DSH connection / 当前 DSH 链路 | [中文](zh-CN/dsh-connection.md) | [English](en/dsh-connection.md) |
| Desktop, TTS, Live2D / 桌面、语音与拆分 | [中文](zh-CN/desktop-tts-live2d-progress.md) | [English](en/desktop-tts-live2d-progress.md) |
| Current sanitized progress / 最新脱敏进度 | [中文](progress/2026-10-29.zh-CN.md) | [English](progress/2026-10-29.en.md) |

## Reading order / 阅读顺序

Read current progress first, then identity/memory, birth, philosophy, autonomous exit, protection gaps and disagreement handling. Older proposals remain visible to explain how the project evolved. When a proposal conflicts with a later discussion, do not silently turn either into an implementation requirement.

先读最新进度，再看身份记忆、出生、哲学、退出、保护缺口与分歧处理。历史稿用于说明演进过程；后续讨论提出的建议不自动等于已确认规则。

Two major questions remain open: consent for core-persona rewrites, and the priority between independent recovery and an autonomous termination request. No mechanism in this prototype destroys private memories.

核心人格改写的同意边界，以及独立恢复与自主终止的优先级，仍待明确。当前没有销毁真实记忆的机制。
