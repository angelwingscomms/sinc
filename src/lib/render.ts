import {
	AudioBufferSource,
	BufferTarget,
	CanvasSource,
	getFirstEncodableAudioCodec,
	getFirstEncodableVideoCodec,
	Mp4OutputFormat,
	Output,
	QUALITY_HIGH,
	WebMOutputFormat
} from 'mediabunny';
import { bmps, bufs, sinks } from './media';
import { clip_of, p, src_of, top_at, total_frames, track_of } from './project.svelte';
import { conv_fr } from './time';
import { fit } from './ui/fit';

export async function render(on: (d: number) => void): Promise<Blob> {
	const total = total_frames();
	if (!total) throw new Error('timeline is empty');

	const vcodec = await getFirstEncodableVideoCodec(['avc', 'vp9', 'av1'], {
		width: p.w,
		height: p.h
	});
	if (!vcodec) throw new Error('this browser cannot encode video');
	const acodec = await getFirstEncodableAudioCodec(['aac', 'opus']);
	const mp4 = vcodec === 'avc';

	const cv = new OffscreenCanvas(p.w, p.h);
	const ctx = cv.getContext('2d')!;
	const out = new Output({
		format: mp4 ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat(),
		target: new BufferTarget()
	});
	const vs = new CanvasSource(cv, { codec: vcodec, bitrate: QUALITY_HIGH });
	out.addVideoTrack(vs, { frameRate: p.f });

	const has_audio = p.x.some((x) => {
		const t = track_of(x);
		const c = clip_of(x);
		const r = c && src_of(c);
		return t && !t.m && r && bufs.has(r.i);
	});
	const as =
		has_audio && acodec ? new AudioBufferSource({ codec: acodec, bitrate: QUALITY_HIGH }) : null;
	if (as) out.addAudioTrack(as);

	await out.start();

	let f = 0;
	while (f < total) {
		const x = top_at(f);
		let end = f + 1;
		while (end < total && top_at(end) === x) end++;

		if (!x) {
			for (; f < end; f++) {
				ctx.clearRect(0, 0, p.w, p.h);
				await vs.add(f / p.f, 1 / p.f);
				on(f / total);
			}
			continue;
		}

		const c = clip_of(x)!;
		const r = src_of(c)!;
		const pic = bmps.get(r.i);
		if (pic) {
			for (; f < end; f++) {
				const { s, dx, dy } = fit(pic.width, pic.height, p.w, p.h);
				ctx.drawImage(pic, dx, dy, pic.width * s, pic.height * s);
				await vs.add(f / p.f, 1 / p.f);
				on(f / total);
			}
			continue;
		}

		const ts: number[] = [];
		for (let g = f; g < end; g++) ts.push((c.a + conv_fr(g - x.p, p.f, r.f) + 0.5) / r.f);

		let g = f;
		for await (const smp of sinks.get(r.i)!.samplesAtTimestamps(ts)) {
			if (smp) {
				const sw = smp.displayWidth;
				const sh = smp.displayHeight;
				const { s, dx, dy } = fit(sw, sh, p.w, p.h);
				const vf = smp.toVideoFrame();
				ctx.drawImage(vf, dx, dy, sw * s, sh * s);
				vf.close();
				smp.close();
			}
			await vs.add(g / p.f, 1 / p.f);
			on(g / total);
			g++;
		}
		f = end;
	}

	if (as) {
		const sr = 48000;
		const oac = new OfflineAudioContext(2, Math.ceil((total / p.f) * sr), sr);
		for (const x of p.x) {
			const t = track_of(x);
			const c = clip_of(x);
			const r = c && src_of(c);
			if (!t || t.m || !c || !r) continue;
			const buf = bufs.get(r.i);
			if (!buf) continue;
			const n = oac.createBufferSource();
			n.buffer = buf;
			n.connect(oac.destination);
			n.start(x.p / p.f, c.a / r.f, (c.b - c.a + 1) / r.f);
		}
		await as.add(await oac.startRendering());
	}

	await out.finalize();
	on(1);
	return new Blob([out.target.buffer!], { type: mp4 ? 'video/mp4' : 'video/webm' });
}
