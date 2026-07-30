export function fit(sw: number, sh: number, dw: number, dh: number) {
	const s = Math.min(dw / sw, dh / sh);
	return { s, dx: (dw - sw * s) / 2, dy: (dh - sh * s) / 2 };
}
