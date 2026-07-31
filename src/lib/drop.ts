import { snap } from './time';

export function drop_pos(
	want: number,
	len: number,
	cands: number[],
	tol_f: number,
	on: boolean
): number {
	if (!on) return Math.max(0, want);
	const head = snap(want, cands, tol_f);
	if (head !== want) return Math.max(0, head);
	const tail = snap(want + len, cands, tol_f);
	return Math.max(0, tail !== want + len ? tail - len : want);
}
