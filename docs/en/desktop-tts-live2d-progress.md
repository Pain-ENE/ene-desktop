# Desktop, speech and Live2D implementation notes

2026-10-29 English public edition. Prebirth prototype only: no formal identity, real model conversation or encrypted memory.

Preview.4 adds opt-in autonomous rest, off by default. After90seconds without ENE interaction it switches between seated/prone static slots at the current display's work-area bottom. It does not autonomously reposition while dragging, chatting, running a task, showing settings or following a selected window. No continuous walking or desktop-folder/icon anchoring is implemented.

Windows System.Speech lists installed voices, selects pace, synthesizes a fixed line, optionally reads demo replies and interrupts playback. This device reported Huihui Desktop(zh-CN) and Zira Desktop(en-US). Chinese WAV generation took approximately684ms in one test; valid audio, cancellation and invalid-voice rejection passed. These are debugging voices, not an approved ENE identity. Settings last only for the current run.

Main-process-managed helpers synthesize/play audio independently of the chat renderer. Emergency stop kills owned speech work, stops DSH and disables rest. It does not automatically restore prior work on resume. There is no guarantee if the main controller itself hangs and no voice-triggered safe word.

The external neural benchmark uses sherpa-onnx2.0.1 and the official `vits-icefall-zh-aishell3` release. Model SHA256 is`5511d651b7840c0a93a6bbfd4afd070a2c7f39ca1ec3ff2ecd73191519bbb852`. A fixed Chinese teasing/caring line was synthesized with speakers10,33,99: duration4.923/6.142/4.287s, synthesis0.187/0.187/0.148s, RTF0.038/0.030/0.035. Loading took812ms with two CPU threads. These whole-utterance results are not streaming latency. Output is8kHz; finite, non-silent WAV and playback checks do not establish pronunciation correctness, naturalness, perceived gender or character similarity. No performer voice was cloned.

The private EXE contains fixed sample comparisons; the public repository omits them. Arbitrary-text live generation in the EXE uses system voices. Neural inference remains in `tools/benchmark-local-tts.py`, with external dependencies/weights excluded. Qwen3-TTS and Kokoro are future higher-quality candidates, not tested claims. Mac MLX remains unverified. Engine licensing alone does not clear model/dataset/voice redistribution.

The local Live2D PSD is a scaffold:54empty planned part layers, original reference and two hidden candidates. A round-trip parser confirmed the reference pixels unchanged. Face-base generation enlarged/misplaced the part; rear-hair generation changed alignment and left glow. Neither candidate was approved for assembly or used at runtime. The public JSON provides the plan only, not extracted layers, a completed PSD or a runnable moc3/model3.json.

The clarified pose source is [POSEMANIACS](https://www.posemaniacs.com/en/about), currently treated as a reference website, not a verified official open-source repository. No models/images/actions were copied. Priorities are dangling-leg sitting, side sitting, chin-supported prone, side resting, knees-up sitting and leaning, then stretching, waving, looking and movement. Large pose changes need separate anatomy/costume/contact-point validation.

Evidence retained privately includes native reports, system/neural speech reports, PSD structure validation and UI screenshots. The public sanitized progress report gives check counts without personal paths, window titles, machine geometry, identifiers or raw logs.
