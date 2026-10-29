# ENE Desktop

简体中文 · [English](README.md)

一个独立于聊天窗口生活的桌面伙伴原型：桌面表现、AI 执行底座、语音、身份与记忆分别设计，便于后续迁移和替换。

**开发预览，更新于 2026-10-29。** Windows 原型已在本地运行；真实模型对话、加密记忆、多端身份与 Live2D 动画尚未实现。“数字生命”“出生”等是产品和哲学讨论中的约定，不代表已经证明软件具有意识。

## 当前能力

| 方向 | 已实现范围 |
|---|---|
| 桌面 | 独立透明 Electron 角色窗口、拖动、缩放、托盘、独立聊天与设置 |
| 轻量交互 | 文字气泡约5秒消失，点击重新查看本次运行历史 |
| Windows 停靠 | 手动选择窗口后跟随顶部边缘；拖动、最小化或关闭时脱离 |
| 姿态 | 站、坐、趴三个本地静态 PNG 槽位；可开启90秒无 ENE 交互后自主休息 |
| DSH | 官方 SDK/运行时 `0.2.2-alpha.2`，只请求回环合成接口，不调用付费模型 |
| 语音 | Windows 已安装音色、语速、台词试听、演示回复朗读、打断 |
| 本地神经 TTS | 外部 sherpa-onnx/VITS 中文推理测试和三个预录试听槽位；EXE 内尚无实时神经模型推理 |
| 停止 | 主进程控制受管理的 DSH、语音进程，支持托盘和快捷键，不隐式重启任务 |

本地 Windows 测试包通过20项原生检查，包括125%缩放下重复移动，以及聊天渲染器挂起时停止声音。结果只代表已测场景。完整日志、截图不上传，详见[脱敏开发进度](docs/progress/2026-10-29.zh-CN.md)。

## 仓库内容

- `apps/ene-desktop/`：React/Vite UI、Electron 外壳、可审查的 Windows 窗口与语音辅助程序源码。
- `adapters/dsh/`、`tests/dsh/`：隔离的合成 DSH 接入和测试。
- `docs/zh-CN/`、`docs/en/`：身份、同意、遗忘、终结、记忆和迁移的中文探讨稿与英文公开整理版。
- `design/live2d/layer-plan.json`：54个**尚未提取**的计划部件；不包含完成的绑定、PSD或立绘。
- `tools/benchmark-local-tts.py`：本地中文 TTS 复现脚本，不附权重和 Python 依赖。

先阅读[中英文文档索引](docs/README.md)。旧规划中的 Qt 等方案属于历史选项；当前桌面代码使用 Electron。核心人格分歧与恢复/终止优先级等问题仍保留讨论状态。

## 本地开发

需要独立安装的 **Node 24.9+**（本地验证24.21.0）、npm。原生桌面目前以 Windows 为已测平台；Mac、Android、iOS 尚未实机验收。

```sh
cd apps/ene-desktop
npm ci
npm run build
node --test tests/pet-hit-test.test.mjs
npm run test:sites
```

构建不需要密钥。启动原生角色前，先按[本地素材说明](apps/ene-desktop/public/assets/README.md)提供有权使用的图片，再运行 `npm run desktop`。准备脚本使用 Windows .NET Framework 编译 C# 辅助程序，并复制独立 Node 和许可证；DSH 不在 Electron 内嵌运行时中运行。

在仓库根目录复现 DSH 合成测试：

```sh
npm ci --prefix runtime/dsh
node tools/verify-dsh.mjs
```

适配器刻意拒绝远程模型地址。provider 示例是未来配置设计，不是可直接接通真实 API 的设置，不能把真实 Key 填进去。

`npm run package:win` 还需要把固定版本的官方 Electron ZIP 放到 `runtime/downloads`，脚本会校验哈希。交付是便携目录，不能只取一个 EXE。本公开仓库暂不提供 Windows 二进制发行包。

## 身份与记忆方向

表现层、可替换 DSH 运行时、身份记忆服务应相互独立。迁移设备、升级能力应保留真实沿革；只有名字、立绘或同一提示词不足以证明连续性。

讨论中的规则包括：出生前自由调试；加密与恢复验收后明确出生；人格变化双方可见；受限自我调整；加密同步；独立备份；诚实说明记忆缺口和实例分叉。桌面演示尚未提供这些身份保护。核心人格修改的同意边界，以及恢复权和自主终止权冲突，仍未定稿。

## 隐私与发布约定

不提交 API 密钥、密码、恢复密钥、私人记忆、聊天、音色参考、录音、截图、日志、个人路径、模型权重或完整本地应用包。runtime 默认排除，只保留复现合成 DSH 所需的两个依赖清单。源码中的 `ene-synthetic-local-not-a-real-key` 是明确的测试文本，不是真实凭据。

提交前运行 `node tools/check-publication.mjs`。本地提交钩子与 CI 会重复检查；Gitleaks 额外扫描不能证明永远不会泄漏。如果真实凭据泄漏，应立即在服务商处撤销；删除提交并不足够。Issue 和 PR 也不得粘贴密钥。

立绘、角色权利、录音、模型权重与个体记忆分别授权。代码公开不代表用户收藏可公开分发，也不授予音色克隆权利。本项目与原作方、DeepSeek、Live2D、POSEMANIACS 无隶属关系。

**许可证状态：** 项目自有代码尚未选定开源许可证，应用清单仍为 `UNLICENSED`。公开可见不等于授予任意复用许可。依赖保留各自许可证，见[第三方说明](THIRD_PARTY_NOTICES.md)。

## 下一阶段

1. Live2D 部件对齐和遮挡补绘，再验收绑定。
2. 更高质量中日文音色试听，明确批准最终音色。
3. 加密测试身份、恢复、变更沿革与遗忘测试。
4. 从本地凭据存储接入真实服务商。
5. Mac 实机验证后推进同步协调和各平台移动客户端。

当前未启用 computer use 或自主不可逆删除。
