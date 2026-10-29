# Initial product and technical research

2026-10-28 historical first plan; English public edition,2026-10-29. Superseded by V2, later governance discussions and current progress. The original claims that no EXE or speech weights existed describe that date's starting state, not the present prototype.

The goal was a Windows-resident ENE companion with expression, playful teasing, conversation and reminders, eventually packaged as a portable application. Default direction: blue electronic appearance, Chinese conversation/speech with optional Japanese, replaceable conversation and TTS backends, stable interaction before complex animation. Collected artwork was authorized only for local noncommercial reference and was not to be uploaded as a public asset library.

The initial source research identified ENE as Mekakushi Dan No.6, formerly Enomoto Takane, a lively electronic character who enjoys teasing Shintaro, with Japanese performance by Kana Asumi. Those references are retained as historical research; the chosen snark/tsundere characterization is an adaptation, not a claim that every detail is canonical across media.

Expression guidelines: tease concrete behavior, then help; accuracy first for serious questions; usually1–3sentences unless analysis is requested; vary expression instead of endlessly repeating a catchphrase; reduce harshness around distress or explicit dislike; never claim unauthorized access to screens/files/cameras; keep pranks in dialogue/visuals rather than destructive operations or unrequested messages. “主人” was a configurable localization preference.

Original sample lines included connection/return, objecting to being dragged like a shortcut, helping with an error, accepting praise while pretending indifference, and encouraging rest. They were original draft dialogue, not quotations from the source work.

The private collection inventory counted141single-character candidates,110uncertain candidates and412excluded files, not deduplicated artworks. Readability/alpha checks did not establish usable transparent production sprites. No local audio references were found. The intended workflow selected one clear electronic-form reference, preserved costume/style, created non-destructive derivatives and tracked origins. Static drawings are not ready-made Live2D rigs.

Six planned expressions were neutral, smug, annoyed, shy, caring and sleepy, separate from interaction states such as idle, touch, drag, thinking, speech and quiet. Small floating motion should be restrained and completely disableable. Original size/color/layout proposals were later superseded by the approved independent transparent character and brief bubbles.

The first feature list proposed transparency, drag/scale/DPI, tray and exit, expression feedback, text chat/streaming/stop/history, speech controls, manual/quiet-time reminders and offline canned lines. Speech recognition, authorized screen context, editable long-term memory, additional skins and Live2D were later stages, with no default continuous microphone or screen reading.

The initial desktop recommendation was Python/PySide6/Qt Quick with native packaging; it is a historical option. Current implementation uses Electron/React and standalone Node for DSH. The enduring separation is shell, behavior, conversation adapter, TTS adapter/player, assets and storage. Model output must pass validation rather than becoming system commands; network/animation work must not freeze dragging. Real API keys belong in local credential storage, not source, distribution config or logs.

The initial hardware review supported evaluating local speech but did not guarantee speed or VRAM headroom. API conversation plus one local speech process avoids unnecessary competition with a local large model.

Voice goals were bright, youthful, clear delivery with playful timing and gentler concern; these were creative goals, not measured properties. Japanese similarity and Chinese naturalness require separate evaluation. GPT-SoVITS and Qwen3-TTS were candidates. No verifiable ready-made ENE model or authorized reference recording had been obtained. Image permission did not grant voice-training permission.

The proposed voice workflow records provenance, selects clean short solo references across delivery styles, saves lossless audio and literal transcripts, compares identical Chinese/Japanese phrases, records latency/stability/emotion/memory, then approves a main voice and stores a versioned profile. Without a reference it remains reference-required, not initialized. Sentence-based cancellable synthesis is preferred; lip animation requires actual face layers, not a claim based on a still image.

Distribution was envisioned as an EXE plus assets and optional weights, with an installer or on-demand model download if one distributable file is needed. Large runtimes/weights are separate; speech starts on demand and can unload when idle. No fixed package size or latency was promised before testing.

Milestones: approve appearance/persona; native desktop prototype and reliable exit; API conversation with network-failure handling; comparative voice tests; portable packaging with empty configuration and no credential leakage. The current progress report replaces this historical checklist's implementation status.

Historical sources: [official ENE page](https://www.mekakucityactors.com/character/006ene.html), [character reference](https://kageroumx4d.com/character/), [cast](https://www.mekakucityactors.com/staffcast/index.html), [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS/blob/main/docs/cn/README.md), [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS), [Qt widgets](https://doc.qt.io/qt-6/qwidget.html), [Qt deployment](https://doc.qt.io/qtforpython-6/deployment/deployment-pyside6-deploy.html). The original investigation reported403on direct access to the ENE page; this edition does not claim fresh playback or voice analysis.
