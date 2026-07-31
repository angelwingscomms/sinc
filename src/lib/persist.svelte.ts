import { get, set } from 'idb-keyval';
import { files, rehydrate } from './media';
import { load_proj, p } from './project.svelte';
import type { proj } from './types';

const KEY = 'sinc_project';

type saved = { p: proj; f: [string, File][] };

export async function save() {
	await set(KEY, { p: $state.snapshot(p), f: [...files] } satisfies saved);
}

export async function restore() {
	const s = (await get(KEY)) as saved | undefined;
	if (!s) return false;
	load_proj(s.p);
	for (const r of s.p.r) {
		const f = s.f.find(([id]) => id === r.i)?.[1];
		if (f) await rehydrate(r, f);
	}
	return true;
}

export async function wipe() {
	await set(KEY, undefined);
}
