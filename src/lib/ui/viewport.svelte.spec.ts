import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import Viewport from './viewport.svelte';
import { bmps } from '$lib/media';
import { p, load_proj } from '$lib/project.svelte';
import type { proj } from '$lib/types';

const proj_with_pic = (): proj => ({
	f: 30,
	w: 320,
	h: 240,
	r: [{ i: 's1', n: 'p', k: 'p', d: 0, f: 30, w: 2, h: 2 }],
	c: [{ i: 'c1', s: 's1', a: 0, b: 0 }],
	t: [{ i: 'v1', k: 'v', n: 'v1', m: 0, h: 0 }],
	m: [],
	x: [{ i: 'x1', c: 'c1', t: 'v1', p: 0, l: 1 }]
});

test('viewport renders picture item centre pixel not black', async () => {
	const cv = new OffscreenCanvas(2, 2);
	const ctx = cv.getContext('2d')!;
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, 2, 2);
	const bmp = await createImageBitmap(cv);
	bmps.set('s1', bmp);
	load_proj(proj_with_pic());
	p.f = 30;
	const s = render(Viewport);
	const canvas = s.baseElement.querySelector('canvas')!;
	await new Promise((r) => requestAnimationFrame(r));
	await new Promise((r) => requestAnimationFrame(r));
	const data = canvas.getContext('2d')!.getImageData(160, 120, 1, 1).data;
	expect(data[0]).toBeGreaterThan(0);
});

test('hidden track renders black centre pixel', async () => {
	const cv = new OffscreenCanvas(2, 2);
	const ctx = cv.getContext('2d')!;
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, 2, 2);
	const bmp = await createImageBitmap(cv);
	bmps.set('s1', bmp);
	load_proj(proj_with_pic());
	p.t[0].h = 1;
	const s = render(Viewport);
	const canvas = s.baseElement.querySelector('canvas')!;
	await new Promise((r) => requestAnimationFrame(r));
	await new Promise((r) => requestAnimationFrame(r));
	const data = canvas.getContext('2d')!.getImageData(160, 120, 1, 1).data;
	expect(data[0]).toBe(0);
});
