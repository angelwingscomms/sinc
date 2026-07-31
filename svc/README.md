# sinc transcription service

Automatic beat/note detection for sinc, powered by
[MuScriptor](https://github.com/muscriptor/muscriptor) (Kyutai + Mirelo), a
multi-instrument audio-to-MIDI transformer. Runs as a tiny Modal app on a
serverless A10G that scales to zero, so an idle sinc costs nothing.

This is the ONLY feature that sends audio out of the browser. v1 of sinc is
fully local — files never leave your machine. Clicking **detect** on a source
uploads that file's bytes to this service and nothing else; the transcription
(onset times + instrument names) comes back, and the audio bytes are discarded.

## Response schema

`POST` the raw audio bytes; returns `{ "t": [{ "n": string, "o": number[] }] }`
where `o` is onset times in seconds. Instrument names are MuScriptor's group
names (`drums`, `electric_bass`, `acoustic_piano`, …).

## Deploy

```bash
cd svc
python -m venv .venv && . .venv/bin/activate
pip install modal
modal setup                       # one-time login
modal secret create hf-token HF_TOKEN=hf_...   # gated CC BY-NC weights
modal deploy transcribe.py
```

Then put the returned URL in `.env`:

```
PUBLIC_MS_URL=https://<workspace>--sinc-transcribe-transcribe.modal.run
```

## Test against the real deployment

```bash
pip install requests numpy
MS_URL=$PUBLIC_MS_URL pytest test_transcribe.py
```

The test posts a synthesized full-mix song (chords + bass + drums at 120 BPM)
and asserts at least one instrument's onsets align with the beat grid
(±60ms). MuScriptor ignores sterile clicks and bare tones, so the fixture is
musical — a real drum machine pattern with pitch content.

## Cost

The container runs only while a request is in flight plus a 120s
scaledown_window, then shuts down. Billing is per GPU-second of actual use.
Model weights are CC BY-NC 4.0 (non-commercial).
