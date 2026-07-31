import subprocess

import modal
import numpy as np
import torch
from fastapi import Request
from muscriptor import TranscriptionModel
from muscriptor.events import NoteStartEvent

image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install("muscriptor")
)

app = modal.App("sinc-transcribe", image=image)

_model = None


def get_model():
    global _model
    if _model is None:
        _model = TranscriptionModel.load_model(device="cuda")
    return _model


def decode(data: bytes) -> tuple[torch.Tensor, int]:
    proc = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            "pipe:0",
            "-f",
            "f32le",
            "-ac",
            "1",
            "-ar",
            "16000",
            "pipe:1",
        ],
        input=data,
        capture_output=True,
        check=True,
    )
    wav = torch.from_numpy(np.frombuffer(proc.stdout, dtype=np.float32).copy())
    return wav, 16000


@app.function(
    gpu="A10G",
    timeout=600,
    scaledown_window=120,
    secrets=[modal.Secret.from_name("hf-token")],
)
@modal.fastapi_endpoint(method="POST")
async def transcribe(request: Request):
    data = await request.body()
    wav, sr = decode(data)
    onsets: dict[str, list[float]] = {}
    for ev in get_model().transcribe((wav, sr)):
        if isinstance(ev, NoteStartEvent):
            onsets.setdefault(ev.instrument, []).append(round(ev.start_time, 4))
    return {"t": [{"n": n, "o": sorted(o)} for n, o in onsets.items()]}
