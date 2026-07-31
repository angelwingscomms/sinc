import {
	ALL_FORMATS,
	BlobSource,
	BufferTarget,
	CanvasSource,
	Input,
	Mp4OutputFormat,
	Output,
	QUALITY_LOW
} from 'mediabunny';
import { expect, test } from 'vitest';
import { render } from './render';
import { p, load_proj, add_clip, place } from './project.svelte';
import { probe, clear_media } from './media';

async function fixture() {
	const cv = document.createElement('canvas');
	cv.width = 320;
	cv.height = 240;
	const ctx = cv.getContext('2d')!;
	const out = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });
	const vs = new CanvasSource(cv, { codec: 'avc', bitrate: QUALITY_LOW });
	out.addVideoTrack(vs, { frameRate: 30 });
	await out.start();
	for (let f = 0; f < 6; f++) {
		ctx.fillStyle = f % 2 ? '#fff' : '#000';
		ctx.fillRect(0, 0, 320, 240);
		await vs.add(f / 30, 1 / 30);
	}
	await out.finalize();
	return new File([out.target.buffer!], 'fixture.mp4', { type: 'video/mp4' });
}

test('render produces a playable mp4', async () => {
	load_proj({
		f: 30,
		w: 320,
		h: 240,
		r: [],
		c: [],
		t: [{ i: 'v1', k: 'v', n: 'V1', m: 0, h: 0 }],
		m: [],
		x: []
	});

	const file = await fixture();
	const src = await probe(file);
	p.r.push(src);
	add_clip(src.i, 0, 5);
	place(p.c[0]!.i, 'v1', 0);

	const calls: number[] = [];
	const blob = await render((d) => calls.push(d));

	expect(blob.size).toBeGreaterThan(0);
	expect(calls[calls.length - 1]).toBe(1);

	const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(blob) });
	const vt = await input.getPrimaryVideoTrack();
	expect(vt).not.toBeNull();
	if (!vt) return;
	expect(await vt.getDisplayWidth()).toBe(320);
	expect(await vt.getDisplayHeight()).toBe(240);
	const d = await vt.computeDuration();
	expect(d).toBeCloseTo(6 / 30, 1);

	clear_media();
});

test('render empty timeline throws', async () => {
	load_proj({
		f: 30,
		w: 320,
		h: 240,
		r: [],
		c: [],
		t: [
			{ i: 'v1', k: 'v', n: 'v1', m: 0, h: 0 },
			{ i: 'a1', k: 'a', n: 'a1', m: 0, h: 0 }
		],
		m: [],
		x: []
	});
	await expect(render(() => {})).rejects.toThrow('timeline is empty');
});
