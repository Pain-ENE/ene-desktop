# Reporting security problems / 安全问题

Never paste keys, passwords, recovery materials, private memories or unredacted logs into public issues or pull requests. Describe the affected version and a reproduction using synthetic data only. If a private reporting channel is unavailable, report only the existence of a potential problem publicly; arrange a private channel before sharing sensitive evidence.

Do not execute destructive tests against real memory. Use disposable identities in isolated directories. No irreversible-erasure mechanism is enabled in this snapshot.

提交前运行 `node tools/check-publication.mjs`，并用 Gitleaks 扫描目录及 Git 历史。发现真实密钥应先撤销，再处理历史；不要为了证明泄漏而公开密钥本身。

自动扫描覆盖有限，不能代替人工审查。此仓库未通过正式安全审计，正式加密记忆尚未实现。
