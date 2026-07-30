import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import Library from './library.svelte';
import { p, ui, load_proj } from '$lib/project.svelte';
import type { proj } from '$lib/types';

const test_proj = (): proj => ({
	f: 30,
	w: 320,
	h: 240,
	r: [
		{ i: 's1', n: 'vid.mp4', k: 'v', d: 300, f: 30, w: 640, h: 480 },
		{ i: 's2', n: 'aud.wav', k: 'a', d: 600, f: 30, w: 0, h: 0 }
	],
	c: [
		{ i: 'c1', s: 's1', a: 0, b: 59 },
		{ i: 'c2', s: 's1', a: 30, b: 89 },
		{ i: 'c3', s: 's2', a: 0, b: 119 }
	],
	t: [
		{ i: 'v1', k: 'v', n: 'V1', m: 0, h: 0 },
		{ i: 'a1', k: 'a', n: 'A1', m: 0, h: 0 }
	],
	m: [],
	x: []
});

test('renders 2 source rows and 3 clip cards', async () => {
	load_proj(test_proj());
	const screen = render(Library);
	await screen.getByText('vid.mp4').element();
	await screen.getByText('aud.wav').element();
	const rows = screen.baseElement.querySelectorAll('[role="button"]');
	expect(rows.length).toBe(2);
});

test('clicking a source sets ui.src_sel', async () => {
	load_proj(test_proj());
	const screen = render(Library);
	await screen.getByText('vid.mp4').click();
	expect(ui.src_sel).toBe('s1');
});

test('clicking a video clip card places item on first video track at playhead', async () => {
	load_proj(test_proj());
	ui.pf = 90;
	render(Library);
	const clips = Array.from(document.querySelectorAll<HTMLButtonElement>('.grid button'));
	expect(clips.length).toBe(3);
	const vid_clip = clips.find((b) => b.textContent?.includes('f ·'));
	if (!vid_clip) throw new Error('no clip card found');
	vid_clip.click();
	expect(p.x.length).toBe(1);
	expect(p.x[0].p).toBe(90);
	expect(p.x[0].t).toBe('v1');
});

test('clicking audio clip card places on first audio track', async () => {
	load_proj(test_proj());
	ui.pf = 10;
	render(Library);
	const clips = Array.from(document.querySelectorAll<HTMLButtonElement>('.grid button'));
	const aud = clips[2]; // third clip is audio
	aud.click();
	expect(p.x.length).toBe(1);
	expect(p.x[0].t).toBe('a1');
});
