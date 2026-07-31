import io
import os
import wave

import numpy as np
import requests

URL = os.environ["MS_URL"]


def make_click_wav(seconds: float = 3.0, sr: int = 16000) -> bytes:
    t = np.arange(int(seconds * sr)) / sr
    wav = np.zeros_like(t)
    for start in np.arange(0.0, seconds, 0.5):
        i0 = int(start * sr)
        i1 = int(min(start + 0.05, seconds) * sr)
        phase = np.arange(i1 - i0) / sr
        wav[i0:i1] = 0.8 * np.sin(2 * np.pi * 1000.0 * phase)
    pcm = (wav * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())
    return buf.getvalue()


def test_click_onsets():
    r = requests.post(URL, data=make_click_wav(), timeout=300)
    r.raise_for_status()
    t = r.json()["t"]
    assert len(t) >= 1, f"no instruments transcribed: {t}"
    wants = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5]
    for group in t:
        matched = sum(any(abs(got - want) <= 0.06 for got in group["o"]) for want in wants)
        if matched >= 4:
            return
    raise AssertionError(f"no instrument aligned with the clicks: {t}")
