# Contributing / 参与开发

Use synthetic data. Read the latest progress report before claiming a capability. Do not add real keys, private chats/memories, screenshots, recordings, character artwork, PSDs, model weights or packaged executables.

Install the local guard after cloning:

```sh
git config core.hooksPath .githooks
node tools/check-publication.mjs
```

Install Gitleaks separately from its official release and verify its checksum. Before publishing, scan both the staged diff and full Git history. The local hook invokes Gitleaks when available; CI always runs the pinned scanner. A bypassed hook does not make a commit safe.

For UI changes, preserve the independent native character, transient small bubbles, on-demand history, stable content sizes and source-alpha-only input hit testing. Never reintroduce an OS drawing clip for the pet. DSH stays in standalone Node, with no new model-visible permissions by default. Test emergency stopping separately from normal successful replies.

For persona/identity work, distinguish drafts from implemented rules. Preserve unresolved objections. Do not fabricate consent, memory, successful actions, encryption or cross-platform validation. Destructive experiments must never target actual user data.

文档修改请同步对应中文/英文版，或明确标记尚未同步。英文公开整理版与逐句全文翻译不同，不能把删节版标为完整翻译。新增事实写清来源、验证范围与未决问题。

Artwork/voice/model permissions are separate from code. The project-authored code license is still undecided; contact the maintainer before assuming broad reuse rights.
