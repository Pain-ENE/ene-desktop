> 当前公开版说明：仅发布代码与文字，不包含本地图片、声音、权重或测试数据。

# ENE 桌面、语音与 Live2D 进展

日期：2026-10-29。当前仍为出生前原型，无正式人格身份、真实模型对话或加密记忆。

## 本轮已实现

桌面版 preview.4 增加自主休息开关，默认关闭。启用后90秒无 ENE 交互，会在当前显示器工作区底边换坐姿或趴姿；聊天、任务运行、拖动、设置打开或窗口停靠时不自主换位。姿态仍为静态 PNG，不是骨骼动画，也未实现文件夹图标锚点。

Windows 系统 TTS 可列出音色、选择语速、试听固定 ENE 台词、朗读演示回复和停止播放。此电脑检测到 Microsoft Huihui Desktop（zh-CN）和 Microsoft Zira Desktop（en-US）。中文固定台词生成约684ms，WAV有效；取消和非法音色检查通过。系统声音是调试后端，未认定为 ENE 最终音色。音色设置仅当前运行有效。

语音由主进程管理辅助进程生成与播放，独立于聊天渲染器。紧急停止关闭休息调度、杀掉受管理的语音辅助进程，并停止 DSH。不会自动恢复请求或自主休息。主进程自身挂死时的系统级停止仍未保证，语音安全词尚未实现。

## 本地神经 TTS 测试

依赖 sherpa-onnx 2.0.1，权重 vits-icefall-zh-aishell3，来自官方发布：
https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-icefall-zh-aishell3.tar.bz2

官方配置说明：https://k2-fsa.github.io/sherpa/onnx/tts/pretrained_models/vits.html

权重 SHA256：5511d651b7840c0a93a6bbfd4afd070a2c7f39ca1ec3ff2ecd73191519bbb852。

固定同文：哼，才不是特意在等你。只是刚好有空而已。记得休息，笨蛋。

| 说话人 | 音频长度 | 整段生成耗时 | RTF |
|---|---:|---:|---:|
| 10 | 4.923秒 | 0.187秒 | 0.038 |
| 33 | 6.142秒 | 0.187秒 | 0.030 |
| 99 | 4.287秒 | 0.148秒 | 0.035 |

Windows本机CPU，两线程，模型首次初始化约812ms。以上是整段生成时间，不能当作流式首包延迟。音频采样率8000Hz；只验证有限值、非静音、WAV格式和可播放，尚未人工确认发音准确、自然度、性别感或人物相似度。没有克隆声优声音。

EXE附带三个预生成样本用于试听，无需Python。任意文本实时推理目前仍使用系统语音；本地神经推理由根目录 `tools/benchmark-local-tts.py` 可复现，未嵌入EXE。测试依赖在 `runtime/tts-python`，权重在 `runtime/tts-models`，不进入公开源代码包。模型/数据许可尚需在公开分发前单独核实，不能把推理引擎的Apache许可自动套到权重和训练音色。

下一轮较高质量音色候选是 Qwen3-TTS（表现力和音色设计）与轻量 Kokoro。尚未下载或实测这两者，Mac MLX路线上也未实测。项目已将实时生成后端、固定试听样本和最终音色批准分别标记，避免把样本播放误报成已接入完整神经语音。

## Live2D

`design/live2d/ene-live2d-preparation.psd` 是7组结构的工程模板，54个待制作部件空层、1个原始参考层和2个隐藏候选。PSD回读校验通过，参考像素未改变。部件未完成提取，不能直接导出可用moc3。

生成脸底不对齐、后发候选有轮廓偏移及残留光晕，两者均未通过装配验收，不进入角色运行资源。母图、透明生成要求、失败约束和后续参数规划保留在 `design/live2d`。

用户澄清姿势来源为 POSEMANIACS。官方说明：https://www.posemaniacs.com/en/about 。目前只确认为姿势参考网站，没有确认到官方开源库，也没有复制其模型或动作。动作优先级为垂腿坐、侧坐、托腮趴、侧卧、抱膝、倚靠，之后再补伸展、挥手、转头和短距离移动。

## 证据

- 开发原生回归：`runtime/desktop-qa/native-smoke.json`。
- 打包回归：`releases/0.1.0-preview.4/ENE-win32-x64/runtime/desktop-qa/native-smoke.json`。
- 系统语音检查：`runtime/tts-tests/system-report.json`。
- 神经模型检查：`runtime/tts-tests/local-model-report.json`。
- PSD结构检查：`design/live2d/preparation-check.json`。
- 浏览器已验证AISHELL3-10样本加载至readyState4，长度4.9235秒；页面UI截图在 `runtime/desktop-qa/voice-settings-preview.png`。
