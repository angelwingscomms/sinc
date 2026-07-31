import io
import os
import wave

import numpy as np
import requests

URL = os.environ["MS_URL"]
SR = 16000
_rng = np.random.default_rng(42)


def _saw(freq: float, dur: float, gain: float = 0.3) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for h in range(1, 12):
        out += (1.0 / h) * np.sin(2 * np.pi * freq * h * t)
    return gain * out / out.max()


def _kick(dur: float = 0.15) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t * 40)
    freq = 60 * np.exp(-t * 25) + 35
    return env * np.sin(2 * np.pi * np.cumsum(freq) / SR)


def _hat(dur: float = 0.04) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    return np.exp(-t * 150) * _rng.normal(0, 0.2, t.size)


def _snare(dur: float = 0.1) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t * 45)
    return env * (0.5 * _rng.normal(0, 0.3, t.size) + 0.4 * np.sin(2 * np.pi * 180 * t))


def make_song_wav(seconds: float = 4.0, bpm: int = 120) -> bytes:
    step = 60.0 / bpm
    chords = [(110, 220, 277), (98, 196, 247), (87, 175, 220), (110, 220, 261)]
    wav = np.zeros(int(seconds * SR))
    n = int(seconds / step)
    for i in range(n):
        t = i * step
        i0 = int(t * SR)
        if i % 4 == 0:
            k = _kick()
            wav[i0 : i0 + k.size] += k
        if i % 2 == 1:
            s = _snare()
            wav[i0 : i0 + s.size] += s
        if i % 2 == 0:
            h = _hat()
            wav[i0 : i0 + h.size] += h
        ch = chords[(i // 2) % 4]
        for f in ch:
            v = _saw(f, step * 0.9, 0.12)
            wav[i0 : i0 + v.size] += v
        b = _saw(chords[(i // 2) % 4][0] / 2, step * 0.9, 0.18)
        wav[i0 : i0 + b.size] += b
    pcm = (np.clip(wav, -1, 1) * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())
    return buf.getvalue()


def test_beat_onsets():
    r = requests.post(URL, data=make_song_wav(), timeout=300)
    r.raise_for_status()
    t = r.json()["t"]
    assert len(t) >= 1, f"no instruments transcribed: {t}"
    wants = [0.5, 1.0, 1.5, 2.0, 2.5]
    for group in t:
        matched = sum(any(abs(got - want) <= 0.06 for got in group["o"]) for want in wants)
        if matched >= 4:
            return
    raise AssertionError(f"no instrument aligned with the beat grid: {t}")
