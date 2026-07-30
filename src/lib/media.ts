import { ALL_FORMATS, BlobSource, Input, VideoSampleSink } from 'mediabunny';
import { p, id, commit } from './project.svelte';
import { clean_fps } from './time';
import type { src } from './types';

export const files = new Map<string, File>();
export const inputs = new Map<string, Input>();
export const sinks = new Map<string, VideoSampleSink>();
export const els = new Map<string, HTMLVideoElement>();
export const bufs = new Map<string, AudioBuffer>();
export const bmps = new Map<string, ImageBitmap>();

let ac: AudioContext | undefined;
export const audio_ctx = () => (ac ??= new AudioContext());

export async function probe(file: File): Promise<src> {
	const i = id();
	files.set(i, file);

	if (file.type.startsWith('image/')) {
		const bmp = await createImageBitmap(file);
		bmps.set(i, bmp);
		return { i, n: file.name, k: 'p', d: 0, f: p.f, w: bmp.width, h: bmp.height };
	}

	const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
	inputs.set(i, input);

	const vt = await input.getPrimaryVideoTrack();
	const at = await input.getPrimaryAudioTrack();

	if (at) {
		bufs.set(i, await audio_ctx().decodeAudioData(await file.arrayBuffer()));
	}

	if (!vt) {
		const d = await input.computeDuration();
		return { i, n: file.name, k: 'a', d, f: p.f, w: 0, h: 0 };
	}

	sinks.set(i, new VideoSampleSink(vt));
	const el = document.createElement('video');
	el.src = URL.createObjectURL(file);
	el.muted = true;
	el.playsInline = true;
	el.preload = 'auto';
	els.set(i, el);

	return {
		i,
		n: file.name,
		k: 'v',
		d: await vt.computeDuration(),
		f: clean_fps((await vt.computePacketStats(100)).averagePacketRate),
		w: await vt.getDisplayWidth(),
		h: await vt.getDisplayHeight()
	};
}

export async function frame_at(sid: string, f: number, fps: number) {
	const sink = sinks.get(sid);
	if (!sink) return bmps.get(sid) ?? null;
	return await sink.getSample((f + 0.5) / fps);
}

export async function thumb(sid: string, f: number, fps: number) {
	const key = sid + ':' + f;
	const hit = bmps.get(key);
	if (hit) return hit;
	const bmp = bmps.get(sid);
	if (bmp) return bmp;
	const smp = await frame_at(sid, f, fps);
	if (!smp || !('toVideoFrame' in smp)) return null;
	const out = await createImageBitmap(smp.toVideoFrame(), {
		resizeWidth: 160,
		resizeQuality: 'low'
	});
	smp.close();
	bmps.set(key, out);
	return out;
}

export function peaks(buf: AudioBuffer, n: number) {
	const d = buf.getChannelData(0);
	const step = Math.max(1, Math.floor(d.length / n));
	const out = new Float32Array(n * 2);
	for (let i = 0; i < n; i++) {
		let lo = 0;
		let hi = 0;
		for (let j = i * step, e = Math.min(d.length, j + step); j < e; j++) {
			if (d[j] < lo) lo = d[j];
			if (d[j] > hi) hi = d[j];
		}
		out[i * 2] = lo;
		out[i * 2 + 1] = hi;
	}
	return out;
}

export function del_src(sid: string) {
	const cids = p.c.filter((c) => c.s === sid).map((c) => c.i);
	for (const cid of cids) p.x = p.x.filter((x) => x.c !== cid);
	p.c = p.c.filter((c) => c.s !== sid);
	const idx = p.r.findIndex((r) => r.i === sid);
	if (idx < 0) return;
	commit();
	p.r.splice(idx, 1);
	const el = els.get(sid);
	if (el) {
		URL.revokeObjectURL(el.src);
		els.delete(sid);
	}
	bmps.get(sid)?.close();
	bmps.delete(sid);
	bufs.delete(sid);
	inputs.delete(sid);
	sinks.delete(sid);
	files.delete(sid);
	// also drop cached thumbnails for this src
	for (const k of bmps.keys()) {
		if (k.startsWith(sid + ':')) {
			bmps.get(k)?.close();
			bmps.delete(k);
		}
	}
}

export async function rehydrate(r: src, file: File) {
	files.set(r.i, file);
	if (r.k === 'p') return void bmps.set(r.i, await createImageBitmap(file));
	const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
	inputs.set(r.i, input);
	const vt = await input.getPrimaryVideoTrack();
	if (await input.getPrimaryAudioTrack())
		bufs.set(r.i, await audio_ctx().decodeAudioData(await file.arrayBuffer()));
	if (!vt) return;
	sinks.set(r.i, new VideoSampleSink(vt));
	const el = document.createElement('video');
	el.src = URL.createObjectURL(file);
	el.muted = true;
	el.playsInline = true;
	el.preload = 'auto';
	els.set(r.i, el);
}
