import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load_proj, p, undo } from './project.svelte';
import { files } from './media';
import { transcribe } from './transcribe';
import type { proj } from './types';

vi.mock('./media', () => ({ files: new Map<string, File>() }));
vi.mock('$app/env/public', () => ({ PUBLIC_MS_URL: 'https://ms.test' }));

const fresh = (): proj => ({
	f: 30,
	w: 1920,
	h: 1080,
	r: [],
	c: [],
	t: [],
	m: [],
	x: []
});

const ok = (t: { n: string; o: number[] }[]) =>
	vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		json: () => Promise.resolve({ t })
	});

describe('transcribe', () => {
	beforeEach(() => {
		load_proj(fresh());
		files.clear();
		vi.unstubAllGlobals();
	});

	it('places markers at the right frames, tagged by instrument', async () => {
		vi.stubGlobal('fetch', ok([{ n: 'kick', o: [0, 0.5] }]));
		files.set('s1', new File(['x'], 'a.wav'));
		await transcribe('s1');
		expect(p.m).toEqual([
			{ p: 0, g: 'kick' },
			{ p: 15, g: 'kick' }
		]);
	});

	it('running twice replaces, never duplicates', async () => {
		vi.stubGlobal('fetch', ok([{ n: 'kick', o: [0, 0.5] }]));
		files.set('s1', new File(['x'], 'a.wav'));
		await transcribe('s1');
		await transcribe('s1');
		expect(p.m.filter((m) => m.g === 'kick').length).toBe(2);
	});

	it('a second instrument adds its own group, leaving kick untouched', async () => {
		vi.stubGlobal('fetch', ok([{ n: 'kick', o: [0, 0.5] }]));
		files.set('s1', new File(['x'], 'a.wav'));
		await transcribe('s1');
		vi.stubGlobal(
			'fetch',
			ok([
				{ n: 'kick', o: [0, 0.5] },
				{ n: 'snare', o: [0.25] }
			])
		);
		await transcribe('s1');
		expect(p.m.filter((m) => m.g === 'kick').length).toBe(2);
		expect(p.m.filter((m) => m.g === 'snare')).toEqual([{ p: 8, g: 'snare' }]);
	});

	it('a non-ok response throws and leaves p.m unchanged', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
		files.set('s1', new File(['x'], 'a.wav'));
		await expect(transcribe('s1')).rejects.toThrow('transcribe failed: 502');
		expect(p.m).toEqual([]);
	});

	it('undo removes the whole transcription in one step', async () => {
		vi.stubGlobal('fetch', ok([{ n: 'kick', o: [0, 0.5] }]));
		files.set('s1', new File(['x'], 'a.wav'));
		await transcribe('s1');
		expect(p.m.length).toBe(2);
		undo();
		expect(p.m).toEqual([]);
	});
});
