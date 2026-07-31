# sinc

beat-sync video editor. behaves like a hardware sampler — near-black chassis, monospace numerics, one magenta pulse.

import media, tap **b** on the beat, press **c** to cut. drag clips on the timeline. hit render, download an mp4.

everything stays in your browser — no uploads, no servers, no accounts.

## keys

| key                 | action                         |
| ------------------- | ------------------------------ |
| `space`             | play / stop                    |
| `b`                 | mark beat at playhead          |
| `c`                 | make clip from selected source |
| `s`                 | set clip in                    |
| `e`                 | set clip out                   |
| `a`                 | add clip (in clip mode)        |
| `←` / `→`           | step frame                     |
| `shift` + `←` / `→` | step 10 frames                 |
| `n`                 | toggle snap                    |
| `z`                 | undo                           |
| `y`                 | redo                           |
| `delete`            | delete selected item           |
| `esc`               | exit clip mode                 |

## requirements

WebCodecs — Chrome, Edge, or Safari 17+. Firefox works for editing but may not support video encoding; if it can't, the render step shows a clear message.

## build

```sh
pnpm install
pnpm run build
pnpm dlx wrangler deploy
```
