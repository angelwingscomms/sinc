import { afterEach, expect, test } from 'vitest';
import { save, restore, wipe } from './persist.svelte';
import { p, load_proj } from './project.svelte';
import { bmps, files } from './media';

afterEach(async () => {
	await wipe();
	files.clear();
	bmps.clear();
});

test('save then restore returns deep-equal project', async () => {
	const cv = new OffscreenCanvas(2, 2);
	cv.getContext('2d')!.fillRect(0, 0, 2, 2);
	const blob = await cv.convertToBlob();
	const file = new File([blob], 'pic.png', { type: 'image/png' });

	load_proj({
		f: 30,
		w: 320,
		h: 240,
		r: [{ i: 's1', n: 'pic.png', k: 'p', d: 0, f: 30, w: 2, h: 2 }],
		c: [{ i: 'c1', s: 's1', a: 0, b: 59 }],
		t: [
			{ i: 'v1', k: 'v', n: 'V1', m: 0, h: 0 },
			{ i: 'a1', k: 'a', n: 'A1', m: 0, h: 0 }
		],
		m: [
			{ p: 10, g: '' },
			{ p: 20, g: '' }
		],
		x: [{ i: 'x1', c: 'c1', t: 'v1', p: 0, l: 60 }]
	});
	files.set('s1', file);
	await new Promise((r) => setTimeout(r, 10));

	await save();

	// mutate project heavily
	p.f = 60;
	p.w = 640;
	p.c = [];

	await restore();

	expect(p.f).toBe(30);
	expect(p.w).toBe(320);
	expect(p.c.length).toBe(1);
	expect(p.c[0].i).toBe('c1');
	expect(p.r.length).toBe(1);
	expect(p.r[0].i).toBe('s1');
	expect(bmps.has('s1')).toBe(true);
});

test('restore with empty store returns false', async () => {
	const ok = await restore();
	expect(ok).toBe(false);
});
