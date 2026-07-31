import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import Timeline from './timeline.svelte';
import { p, ui, load_proj } from '$lib/project.svelte';
import type { proj } from '$lib/types';

const test_proj = (): proj => ({
	f: 30,
	w: 320,
	h: 240,
	r: [{ i: 's1', n: 'v', k: 'v', d: 300, f: 30, w: 640, h: 480 }],
	c: [{ i: 'c1', s: 's1', a: 0, b: 59 }],
	t: [
		{ i: 'v1', k: 'v', n: 'V1', m: 0, h: 0 },
		{ i: 'a1', k: 'a', n: 'A1', m: 0, h: 0 }
	],
	m: [],
	x: [{ i: 'x1', c: 'c1', t: 'v1', p: 0, l: 60 }]
});

test('item pos/width at zoom 4', async () => {
	load_proj(test_proj());
	ui.zoom = 4;
	ui.scroll = 0;
	render(Timeline);
	const item = document.querySelector<HTMLElement>('[data-tid="v1"] > div')!;
	expect(item).toBeTruthy();
	const s = item.getAttribute('style');
	expect(s).toContain('left: 0px');
	expect(s).toContain('width: 240px');
	ui.scroll = 10;
	await new Promise((r) => requestAnimationFrame(r));
	const s2 = item.getAttribute('style');
	expect(s2).toContain('left: -40px');
});

test('drag with snap off lands 25px delta', async () => {
	load_proj(test_proj());
	ui.zoom = 4;
	ui.snap = 0;
	render(Timeline);
	const item = document.querySelector<HTMLElement>('[data-tid="v1"] > div[role="button"]')!;
	item.dispatchEvent(
		new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, bubbles: true })
	);
	item.dispatchEvent(
		new PointerEvent('pointermove', { pointerId: 1, clientX: 200, bubbles: true })
	);
	item.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));
	await new Promise((r) => setTimeout(r, 10));
	expect(p.x[0].p).toBe(25);
});

test('drag with snap on snaps to marker at 24', async () => {
	load_proj(test_proj());
	p.m.push({ p: 24, g: '' });
	ui.zoom = 4;
	ui.snap = 1;
	render(Timeline);
	const item = document.querySelector<HTMLElement>('[data-tid="v1"] > div[role="button"]')!;
	item.dispatchEvent(
		new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, bubbles: true })
	);
	item.dispatchEvent(
		new PointerEvent('pointermove', { pointerId: 1, clientX: 200, bubbles: true })
	);
	item.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }));
	await new Promise((r) => setTimeout(r, 10));
	expect(p.x[0].p).toBe(24);
});

test('mute toggle flips track m', async () => {
	load_proj(test_proj());
	render(Timeline);
	const btn = document.querySelector<HTMLElement>('[aria-label="mute V1"]')!;
	btn.click();
	expect(p.t[0].m).toBe(1);
	btn.click();
	expect(p.t[0].m).toBe(0);
});
