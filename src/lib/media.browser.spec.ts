import { BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_LOW } from 'mediabunny';
import { expect, test } from 'vitest';
import { peaks, probe } from './media';

async function fixture() {
	const cv = document.createElement('canvas');
	cv.width = 320;
	cv.height = 240;
	const ctx = cv.getContext('2d')!;
	const out = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });
	const vs = new CanvasSource(cv, { codec: 'avc', bitrate: QUALITY_LOW });
	out.addVideoTrack(vs, { frameRate: 30 });
	await out.start();
	for (let f = 0; f < 30; f++) {
		ctx.fillStyle = f % 2 ? '#fff' : '#000';
		ctx.fillRect(0, 0, 320, 240);
		await vs.add(f / 30, 1 / 30);
	}
	await out.finalize();
	return new File([out.target.buffer!], 'fix.mp4', { type: 'video/mp4' });
}

test('probe reads a real mp4', async () => {
	const r = await probe(await fixture());
	expect(r.k).toBe('v');
	expect(r.w).toBe(320);
	expect(r.h).toBe(240);
	expect(r.f).toBe(30);
	expect(r.d).toBeCloseTo(1, 1);
});

test('peaks envelope', () => {
	const ctx = new OfflineAudioContext(1, 400, 48000);
	const buf = ctx.createBuffer(1, 400, 48000);
	buf.getChannelData(0).fill(0.5, 0, 200);
	buf.getChannelData(0).fill(-0.25, 200, 400);
	const pk = peaks(buf, 2);
	expect(pk[1]).toBeCloseTo(0.5, 2);
	expect(pk[2]).toBeCloseTo(-0.25, 2);
});
