# ENE DSH M0 接入

这是出生前的真实 DSH 运行时接入验证，模型响应由本机合成服务提供。没有使用真实 API 凭据、私人记忆、computer use 或不可逆删除。

## 运行

需要 Node >=24.9.0。安装固定依赖后，运行 `node tools/verify-dsh.mjs`，或双击项目根目录的 `验证DSH接入.cmd`。

依赖安装位置为 `runtime/dsh`，使用该目录的 package-lock.json 重现依赖：`npm ci --ignore-scripts --no-audit --no-fund`。本阶段没有运行第三方安装脚本。

某些受限环境禁止子进程连接本机服务，会出现 `EACCES 127.0.0.1`；这不是云端 API 错误。验证需要允许本机回环连接，不需要访问公网模型。

## 当前组件

- `runtime.mjs`：通过官方 Node SDK 启动 DSH，固定隔离 home、清理子进程环境、拒绝非回环模型端点，串行运行、恢复与锁定停止状态。
- `ene-m0.cordis.yml`：关闭模型可见的文件和命令执行工具；不依赖提示词来取消这些工具。合成测试禁用重试，错误明确上报。
- `tests/dsh/mock-model.mjs`：本机 Messages/chat 协议合成服务，支持正常回复、服务错误和挂起请求。
- `tests/dsh/integration.test.mjs`：使用真实 npm DSH 的集成测试。测试目录和报告保留在 runtime/test-runs，默认忽略版本管理。

## 边界

官方 Python SDK 的预构建包在当前查询索引中不可安装，因此本阶段使用同版本官方 Node SDK。未来 Python 桌面层可通过本地桥接协议接入；不是使用私有启动参数伪造 Python SDK 已验证。

`stop()` 目前使用 SDK 公共 close() 的关停流程并锁定适配器，丢弃迟到回复。它不是已经完成的独立安全词/快捷键控制器，也没有验证包含任意外部工具进程树的强制终止。请求超时与真正停止不同，调用方不能把普通 timeout 当作已取消远端任务。

JSONL 会话仍包含合成提示和回复，是下一阶段加密 provider 的明确改造点。当前没有加密或真正的身份记忆服务。测试中的 DSH 会话编号不是 ENE 正式身份。

流式数据是否已经可在桌面逐字展示，应根据实际通知字段确认；不能把收到任意通知等同于已验证逐 token UI。

模型 API 的兼容性与智能表现还没有验证。本机 mock 只证明传输、运行时和客户端行为；不应声称 ENE 已有真实 AI 对话能力。

## 第三方接口接入约定（2026-10-28）

用户选择暂不绑定服务商，未来以 DeepSeek 或 Claude 为主。配置设计见 `provider.example.json`，不是可直接运行的真实 API 配置。地址、模型、上下文容量和输出上限暂留空，等选定实际服务后按其文档填写；不沿用测试容量。

- `openai-completions` 是 DSH 对 Chat Completions 协议的名称。已通过 `llm-pi-ai` 和本机合成服务验证回复、历史恢复、503 错误上报、中途停止和无工具暴露。
- `anthropic-messages` 和 `openai-responses` 是上游提供的其他协议，ENE 尚未完成对应网关集成验证。已有 DeepSeek Messages 测试不能等同于 Claude API 已验证。
- `ene-gateway-m0.cordis.yml` 仅用于合成测试，不可替换地址后直接承载私人记忆。现有适配器仍拒绝公网模型地址。
- 真实密钥不进入 JSON、角色文件或记忆同步。正式版由本机凭据存储取出，仅向模型子进程注入；凭据存储尚待实现，示例只保留引用名。
- 更换供应商、模型或架构是能力变更；正式身份服务建成后应记录变更事件并保留身份链。当前尚未实现该身份服务，DSH sessionId 不能充当身份凭证。

测试报告分别为 `runtime/dsh/m0-latest.json` 与 `runtime/dsh/gateway-m0-latest.json`。两者均为合成数据验证，不代表真实服务的工具调用、视觉能力、费用或上下文容量已确认。
