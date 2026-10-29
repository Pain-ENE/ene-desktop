"""Generate repeatable Chinese samples locally; no network during inference."""
import sys, pathlib, time, json, wave, hashlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'runtime/tts-python'))
import numpy as np
import sherpa_onnx
model = ROOT / 'runtime/tts-models/vits-icefall-zh-aishell3'
out = ROOT / 'runtime/tts-tests'
out.mkdir(parents=True, exist_ok=True)
began = time.perf_counter()
config = sherpa_onnx.OfflineTtsConfig(
    model=sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(
            model=str(model / 'model.onnx'), lexicon=str(model / 'lexicon.txt'), tokens=str(model / 'tokens.txt')),
        num_threads=2, provider='cpu', debug=False),
    rule_fsts=','.join(str(model / name) for name in ['phone.fst', 'date.fst', 'number.fst']),
    max_num_sentences=1)
if not config.validate(): raise RuntimeError('Invalid TTS configuration')
tts = sherpa_onnx.OfflineTts(config)
load_ms = round((time.perf_counter() - began) * 1000)
text = '哼，才不是特意在等你。只是刚好有空而已。记得休息，笨蛋。'
report = {'backend': 'sherpa-onnx', 'version': sherpa_onnx.__version__, 'model': model.name, 'provider': 'CPU', 'threads': 2, 'loadMs': load_ms, 'modelSha256': hashlib.sha256((model / 'model.onnx').read_bytes()).hexdigest(), 'text': text, 'samples': [], 'subjectiveVoiceApproval': False, 'macVerified': False}
for sid in [10, 33, 99]:
    began = time.perf_counter()
    audio = tts.generate(text, sid=sid, speed=1.0)
    elapsed = time.perf_counter() - began
    samples = np.asarray(audio.samples)
    if not len(samples) or not np.isfinite(samples).all() or np.max(np.abs(samples)) < 0.001:
        raise RuntimeError('Empty or invalid audio')
    name = f'aishell3-{sid}.wav'
    with wave.open(str(out / name), 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(audio.sample_rate)
        f.writeframes((np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes())
    duration = len(samples) / audio.sample_rate
    report['samples'].append({'file': name, 'speaker': sid, 'sampleRate': audio.sample_rate, 'durationSeconds': round(duration, 3), 'synthesisSeconds': round(elapsed, 3), 'rtf': round(elapsed / duration, 3), 'peak': round(float(np.max(np.abs(samples))), 4)})
report['status'] = 'passed'
(out / 'local-model-report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False))
