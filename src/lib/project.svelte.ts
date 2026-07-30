import { conv_fr } from './time';
import type { clip, item, proj } from './types';

export const id = () => Math.random().toString(36).slice(2, 10);

const fresh = (): proj => ({
	f: 30,
	w: 1920,
	h: 1080,
	r: [],
	c: [],
	t: [
		{ i: 'v1', k: 'v', n: 'v1', m: 0, h: 0 },
		{ i: 'a1', k: 'a', n: 'a1', m: 0, h: 0 }
	],
	m: [],
	x: []
});

export const p = $state<proj>(fresh());

export const ui = $state({
	pf: 0,
	playing: false,
	mode: 'e' as 'e' | 'c',
	sel: '',
	src_sel: '',
	zoom: 4,
	scroll: 0,
	snap: 1 as 0 | 1
});

let past: string[] = [];
let future: string[] = [];

export function commit() {
	past.push(JSON.stringify($state.snapshot(p)));
	if (past.length > 50) past.shift();
	future = [];
}

const apply = (s: string) => Object.assign(p, JSON.parse(s) as proj);

export function undo() {
	const s = past.pop();
	if (!s) return;
	future.push(JSON.stringify($state.snapshot(p)));
	apply(s);
}

export function redo() {
	const s = future.pop();
	if (!s) return;
	past.push(JSON.stringify($state.snapshot(p)));
	apply(s);
}

export function load_proj(next: proj) {
	past = [];
	future = [];
	Object.assign(p, next);
}

export const src_of = (c: clip) => p.r.find((r) => r.i === c.s);
export const clip_of = (x: item) => p.c.find((c) => c.i === x.c);
export const track_of = (x: item) => p.t.find((t) => t.i === x.t);

export function item_len(c: clip) {
	const r = src_of(c);
	return Math.max(1, conv_fr(c.b - c.a + 1, r ? r.f : p.f, p.f));
}

export function add_marker(f: number, g = '') {
	if (p.m.some((m) => m.g === g && Math.abs(m.p - f) < 2)) return;
	commit();
	p.m.push({ p: f, g });
	p.m.sort((a, b) => a.p - b.p);
}

export function del_marker(f: number, g = '') {
	const i = p.m.findIndex((m) => m.g === g && m.p === f);
	if (i < 0) return;
	commit();
	p.m.splice(i, 1);
}

export function add_clip(s: string, a: number, b: number) {
	commit();
	const c: clip = { i: id(), s, a: Math.min(a, b), b: Math.max(a, b) };
	p.c.push(c);
	return c;
}

export function place(cid: string, tid: string, pos: number) {
	const c = p.c.find((x) => x.i === cid);
	if (!c) return;
	commit();
	const x: item = { i: id(), c: cid, t: tid, p: Math.max(0, pos), l: item_len(c) };
	p.x.push(x);
	return x;
}

export function move_item(iid: string, tid: string, pos: number) {
	const x = p.x.find((v) => v.i === iid);
	if (!x) return;
	commit();
	x.t = tid;
	x.p = Math.max(0, pos);
}

export function del_item(iid: string) {
	const i = p.x.findIndex((v) => v.i === iid);
	if (i < 0) return;
	commit();
	p.x.splice(i, 1);
	if (ui.sel === iid) ui.sel = '';
}

export function add_track(k: 'v' | 'a') {
	commit();
	const n = k + String(p.t.filter((t) => t.k === k).length + 1);
	p.t.push({ i: id(), k, n, m: 0, h: 0 });
}

export const total_frames = () => p.x.reduce((n, x) => Math.max(n, x.p + x.l), 0);

export function top_at(f: number) {
	let best: item | undefined;
	let rank = -1;
	for (const x of p.x) {
		if (f < x.p || f >= x.p + x.l) continue;
		const t = track_of(x);
		if (!t || t.k !== 'v' || t.h) continue;
		const r = p.t.indexOf(t);
		if (r > rank) {
			rank = r;
			best = x;
		}
	}
	return best;
}
