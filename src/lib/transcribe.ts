import { PUBLIC_MS_URL } from '$app/env/public';
import { files } from './media';
import { commit, p } from './project.svelte';
import { sec_to_fr } from './time';

export async function transcribe(sid: string) {
	const f = files.get(sid);
	if (!f) return;
	const res = await fetch(PUBLIC_MS_URL, { method: 'POST', body: f });
	if (!res.ok) throw new Error('transcribe failed: ' + res.status);
	const { t } = (await res.json()) as { t: { n: string; o: number[] }[] };
	commit();
	p.m = p.m.filter((m) => !t.some((x) => x.n === m.g));
	for (const x of t) for (const o of x.o) p.m.push({ p: sec_to_fr(o, p.f), g: x.n });
	p.m.sort((a, b) => a.p - b.p);
}
