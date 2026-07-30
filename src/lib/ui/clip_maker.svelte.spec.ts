import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import ClipMaker from './clip_maker.svelte';
import { p, ui, load_proj } from '$lib/project.svelte';
import { bmps } from '$lib/media';
import type { proj } from '$lib/types';

const proj_with_pic = (): proj => ({
	f: 30,
	w: 320,
	h: 240,
	r: [{ i: 's1', n: 'p', k: 'p', d: 0, f: 30, w: 2, h: 2 }],
	c: [],
	t: [],
	m: [],
	x: []
});

test('clip maker renders readout', async () => {
	const cv = new OffscreenCanvas(2, 2);
	cv.getContext('2d')!.fillRect(0, 0, 2, 2);
	bmps.set('s1', await createImageBitmap(cv));
	load_proj(proj_with_pic());
	ui.mode = 'c';
	ui.src_sel = 's1';
	const { baseElement } = render(ClipMaker);
	await new Promise((r) => requestAnimationFrame(r));
	const readout = baseElement.querySelector('[data-r="readout"]');
	expect(readout?.textContent).toBeTruthy();
});

test('picture source: press a adds clip and exits clip mode', async () => {
	const cv = new OffscreenCanvas(2, 2);
	cv.getContext('2d')!.fillRect(0, 0, 2, 2);
	bmps.set('s1', await createImageBitmap(cv));
	load_proj(proj_with_pic());
	ui.mode = 'c';
	ui.src_sel = 's1';
	render(ClipMaker);
	await new Promise((r) => setTimeout(r, 50));
	window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
	await new Promise((r) => setTimeout(r, 10));
	expect(p.c.length).toBe(1);
	expect(ui.mode).toBe('e');
});
