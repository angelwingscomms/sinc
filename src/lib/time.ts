export const fr_to_sec = (f: number, fps: number) => f / fps;

export const sec_to_fr = (s: number, fps: number) => Math.round(s * fps);

export const conv_fr = (f: number, from: number, to: number) =>
	from === to ? f : Math.round((f * to) / from);

const pad = (n: number) => String(n).padStart(2, '0');

export const tc = (f: number, fps: number) => {
	const r = Math.round(fps);
	const t = Math.max(0, Math.trunc(f));
	return [Math.floor(t / (r * 3600)), Math.floor(t / (r * 60)) % 60, Math.floor(t / r) % 60, t % r]
		.map(pad)
		.join(':');
};

export const snap = (f: number, cands: number[], tol: number) => {
	let best = f;
	let d = tol + 1;
	for (const c of cands) {
		const n = Math.abs(c - f);
		if (n < d || (n === d && c < best)) {
			d = n;
			best = c;
		}
	}
	return d <= tol ? best : f;
};

const COMMON = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60];

export const clean_fps = (f: number) => {
	let best: number | undefined;
	let best_d = 0.12;
	for (const c of COMMON) {
		const d = Math.abs(c - f);
		if (d < best_d) {
			best_d = d;
			best = c;
		}
	}
	return best ?? Math.round(f * 1000) / 1000;
};
