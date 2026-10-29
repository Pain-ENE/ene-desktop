# Third-party and asset boundaries / 第三方与素材边界

- DeepSeek Harness and SDK: pinned `0.2.2-alpha.2`; upstream https://github.com/deepseek-ai/deepseek-harness, reviewed commit recorded in `DSH_UPSTREAM.json`. The private upstream checkout is not vendored here. Preserve upstream license notices when distributing dependencies.
- Electron, Node.js, React, Vite, Lucide and other npm dependencies retain their respective licenses. Lockfiles describe the dependency graph; they do not replace license files.
- Windows speech uses installed OS voices through System.Speech; no voice database is distributed.
- sherpa-onnx is an external optional test dependency. Its license does not automatically establish the permissions for every model, dataset or speaker recording. Weights and generated voice samples are excluded here.
- Live2D is a future integration. No Cubism Core binary or finished ENE rig is distributed.
- POSEMANIACS is a pose reference source, not a verified code or animation dependency: https://www.posemaniacs.com/en/about . No site models, pose images or animations are included.
- ENE / Enomoto Takane and associated original designs belong to their respective rights holders. Privately collected artwork, derivatives, PSDs, audio references and screenshots are excluded. No redistribution or voice-cloning permission is granted by publishing this repository.

源码、依赖、美术、声音、模型与私人记忆分别管理。项目自有代码许可证仍待选择，不能把第三方 MIT/Apache 许可自动套用于全部内容。
