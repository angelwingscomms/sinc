import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import MarkerRail from './marker_rail.svelte';
import { p, ui, load_proj } from '$lib/project.svelte';
import type { proj } from '$lib/types';

const proj_with_markers = (): proj => ({
	f: 30,
	w: 1920,
	h: 1080,
	r: [],
	c: [],
	t: [],
	x: [],
	m: [
		{ p: 10, g: '' },
		{ p: 40, g: '' }
	]
});

test('two markers at correct pixel positions', async () => {
	load_proj(proj_with_markers());
	ui.zoom = 4;
	ui.scroll = 0;
	const s = render(MarkerRail);
	const btns = s.baseElement.querySelectorAll('.mk');
	expect(btns.length).toBe(2);
	expect((btns[0] as HTMLElement).style.left).toBe('40px');
	expect((btns[1] as HTMLElement).style.left).toBe('160px');
});

test('scroll shifts marker positions', async () => {
	load_proj(proj_with_markers());
	ui.zoom = 4;
	ui.scroll = 5;
	const s = render(MarkerRail);
	const btns = s.baseElement.querySelectorAll('.mk');
	expect((btns[0] as HTMLElement).style.left).toBe('20px');
	expect((btns[1] as HTMLElement).style.left).toBe('140px');
});

test('playing over marker makes it hot', async () => {
	load_proj(proj_with_markers());
	ui.zoom = 4;
	ui.scroll = 0;
	ui.playing = true;
	ui.pf = 10;
	const s = render(MarkerRail);
	const btns = s.baseElement.querySelectorAll('.mk');
	expect(btns[0].classList.contains('hot')).toBe(true);
	expect(btns[1].classList.contains('hot')).toBe(false);
});

test('two groups render two rows, empty group first', async () => {
	load_proj({
		...proj_with_markers(),
		m: [
			{ p: 10, g: '' },
			{ p: 20, g: 'kick' }
		]
	});
	ui.zoom = 4;
	ui.scroll = 0;
	const s = render(MarkerRail);
	const rows = s.baseElement.querySelectorAll('.relative');
	expect(rows.length).toBe(2);
	expect(rows[0].textContent).toContain('taps');
});

test('clicking marker removes it', async () => {
	load_proj(proj_with_markers());
	ui.zoom = 4;
	ui.scroll = 0;
	const s = render(MarkerRail);
	const btns = s.baseElement.querySelectorAll('.mk');
	(btns[0] as HTMLButtonElement).click();
	expect(p.m.length).toBe(1);
});
