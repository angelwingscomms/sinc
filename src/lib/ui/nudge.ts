export function nudge(
	a: number,
	b: number,
	which: 'a' | 'b',
	d: number,
	last: number
): [number, number] {
	if (which === 'a') {
		const n = Math.min(Math.max(0, a + d), b);
		return [n, b];
	}
	const n = Math.max(Math.min(last, b + d), a);
	return [a, n];
}
