import { describe, expect, it } from 'vitest';
import {
	add_marker,
	del_clip,
	del_item,
	item_len,
	load_proj,
	p,
	place,
	redo,
	snap_group,
	top_at,
	undo,
	ui
} from './project.svelte';
import type { proj } from './types';

const initial = (): proj => ({
	f: 30,
	w: 1920,
	h: 1080,
	r: [],
	c: [{ i: 'c1', s: 's1', a: 0, b: 59 }],
	t: [
		{ i: 'v1', k: 'v', n: 'v1', m: 0, h: 0 },
		{ i: 'v2', k: 'v', n: 'v2', m: 0, h: 0 },
		{ i: 'a1', k: 'a', n: 'a1', m: 0, h: 0 }
	],
	m: [],
	x: []
});

describe('project store', () => {
	it('add_marker dedupes within <2 frames', () => {
		load_proj(structuredClone(initial()));
		add_marker(10);
		add_marker(11);
		expect(p.m.length).toBe(1);
		add_marker(12);
		expect(p.m.length).toBe(2);
		add_marker(11, 'kick');
		expect(p.m.length).toBe(3);
	});

	it('markers stay sorted by p after out-of-order inserts', () => {
		load_proj(structuredClone(initial()));
		add_marker(100);
		add_marker(10);
		add_marker(50);
		expect(p.m.map((m) => m.p)).toEqual([10, 50, 100]);
	});

	it('item_len: src f=60, clip a=0 b=59 (60 src frames), project f=30 => 30', () => {
		load_proj({
			...initial(),
			r: [{ i: 's1', n: 't', k: 'v', d: 2, f: 60, w: 1920, h: 1080 }]
		});
		const c = p.c.find((x) => x.i === 'c1')!;
		expect(item_len(c)).toBe(30);
	});

	it('item_len never returns 0: src f=60, clip a=0 b=0 => 1', () => {
		load_proj({
			...initial(),
			r: [{ i: 's1', n: 't', k: 'v', d: 2, f: 60, w: 1920, h: 1080 }],
			c: [{ i: 'c1', s: 's1', a: 0, b: 0 }]
		});
		const c = p.c.find((x) => x.i === 'c1')!;
		expect(item_len(c)).toBe(1);
	});

	it('place then undo restores empty, redo restores item', () => {
		load_proj(structuredClone(initial()));
		place('c1', 'v1', 10);
		expect(p.x.length).toBe(1);
		undo();
		expect(p.x.length).toBe(0);
		redo();
		expect(p.x.length).toBe(1);
	});

	it('undo with empty history is no-op', () => {
		load_proj(structuredClone(initial()));
		expect(() => undo()).not.toThrow();
	});

	it('del_item clears ui.sel when it matches', () => {
		load_proj(structuredClone(initial()));
		const x = place('c1', 'v1', 10)!;
		ui.sel = x.i;
		del_item(x.i);
		expect(ui.sel).toBe('');
	});

	it('top_at: overlapping items on v1, v2 returns v2', () => {
		load_proj(structuredClone(initial()));
		p.x.push({ i: 'x1', c: 'c1', t: 'v1', p: 0, l: 100 });
		p.x.push({ i: 'x2', c: 'c1', t: 'v2', p: 0, l: 100 });
		const t = top_at(50);
		expect(t?.i).toBe('x2');
	});

	it('top_at: hide v2 returns v1', () => {
		load_proj(structuredClone(initial()));
		p.x.push({ i: 'x1', c: 'c1', t: 'v1', p: 0, l: 100 });
		p.x.push({ i: 'x2', c: 'c1', t: 'v2', p: 0, l: 100 });
		const v2 = p.t.find((t) => t.i === 'v2')!;
		v2.h = 1;
		const t = top_at(50);
		expect(t?.i).toBe('x1');
	});

	it('del_clip removes clip and its items; undo restores both', () => {
		load_proj(structuredClone(initial()));
		place('c1', 'v1', 10);
		expect(p.c.length).toBe(1);
		expect(p.x.length).toBe(1);
		del_clip('c1');
		expect(p.c.length).toBe(0);
		expect(p.x.length).toBe(0);
		undo();
		expect(p.c.length).toBe(1);
		expect(p.x.length).toBe(1);
	});

	it('top_at: frame outside both returns undefined', () => {
		load_proj(structuredClone(initial()));
		p.x.push({ i: 'x1', c: 'c1', t: 'v1', p: 0, l: 10 });
		const t = top_at(50);
		expect(t).toBeUndefined();
	});

	it('snap_group snaps video items to nearby group markers, not audio', () => {
		load_proj(structuredClone(initial()));
		p.x.push({ i: 'x1', c: 'c1', t: 'v1', p: 100, l: 20 });
		p.x.push({ i: 'x2', c: 'c1', t: 'a1', p: 100, l: 20 });
		add_marker(90, 'kick');
		add_marker(300, 'kick');
		snap_group('kick');
		expect(p.x.find((x) => x.i === 'x1')?.p).toBe(90);
		expect(p.x.find((x) => x.i === 'x2')?.p).toBe(100);
	});

	it('snap_group leaves items untouched beyond 12 frames', () => {
		load_proj(structuredClone(initial()));
		p.x.push({ i: 'x1', c: 'c1', t: 'v1', p: 100, l: 20 });
		add_marker(140, 'kick');
		snap_group('kick');
		expect(p.x.find((x) => x.i === 'x1')?.p).toBe(100);
	});

	it('snap_group with no markers is a no-op and undo restores in one step', () => {
		load_proj(structuredClone(initial()));
		p.x.push({ i: 'x1', c: 'c1', t: 'v1', p: 100, l: 20 });
		add_marker(90, 'kick');
		snap_group('drums');
		expect(p.x.find((x) => x.i === 'x1')?.p).toBe(100);
		snap_group('kick');
		expect(p.x.find((x) => x.i === 'x1')?.p).toBe(90);
		undo();
		expect(p.x.find((x) => x.i === 'x1')?.p).toBe(100);
	});
});
