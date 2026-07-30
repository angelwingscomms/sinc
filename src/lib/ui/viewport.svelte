<script lang="ts">
	import { bmps, els, audio_ctx, bufs } from '$lib/media';
	import { clip_of, p, src_of, top_at, total_frames, track_of, ui } from '$lib/project.svelte';
	import { conv_fr } from '$lib/time';
	import { fit } from './fit';

	let cv: HTMLCanvasElement;
	let raf = 0;
	let t0 = 0;
	let f0 = 0;

	export function play() {
		void audio_ctx().resume();
		t0 = performance.now();
		f0 = ui.pf;
		ui.playing = true;
		schedule();
	}

	export function stop() {
		ui.playing = false;
		clear_audio();
	}

	export function seek(f: number) {
		ui.pf = f;
		if (ui.playing) {
			t0 = performance.now();
			f0 = f;
			schedule();
		}
	}

	let nodes: AudioBufferSourceNode[] = [];

	function clear_audio() {
		for (const n of nodes) {
			try {
				n.stop();
			} catch {
				/* already ended */
			}
		}
		nodes = [];
	}

	function schedule() {
		clear_audio();
		const ac = audio_ctx();
		const t = ac.currentTime + 0.05;
		for (const x of p.x) {
			const tr = track_of(x);
			const c = clip_of(x);
			const r = c && src_of(c);
			if (!tr || tr.m || !c || !r) continue;
			const buf = bufs.get(r.i);
			if (!buf) continue;
			const start_f = Math.max(x.p, ui.pf);
			const off = (c.a + conv_fr(start_f - x.p, p.f, r.f)) / r.f;
			const dur = (x.p + x.l - start_f) / p.f;
			if (dur <= 0) continue;
			const n = ac.createBufferSource();
			n.buffer = buf;
			n.connect(ac.destination);
			n.start(t + (start_f - ui.pf) / p.f, off, dur);
			nodes.push(n);
		}
	}

	function tick(now: number) {
		if (ui.playing) {
			ui.pf = f0 + Math.round(((now - t0) / 1000) * p.f);
			if (ui.pf >= total_frames()) stop();
		}
		draw();
		raf = requestAnimationFrame(tick);
	}

	function draw() {
		const ctx = cv.getContext('2d')!;
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.fillRect(0, 0, p.w, p.h);
		const x = top_at(ui.pf);
		if (!x) return;
		const c = clip_of(x);
		const r = c && src_of(c);
		if (!c || !r) return;

		const src_f = c.a + conv_fr(ui.pf - x.p, p.f, r.f);
		const pic = bmps.get(r.i);
		if (pic) return void draw_fit(ctx, pic, pic.width, pic.height);

		const el = els.get(r.i);
		if (!el || el.readyState < 2) return;
		const want = (src_f + 0.5) / r.f;
		if (Math.abs(el.currentTime - want) > 0.15) el.currentTime = want;
		if (ui.playing && el.paused) void el.play();
		if (!ui.playing && !el.paused) el.pause();
		draw_fit(ctx, el, r.w, r.h);
	}

	function draw_fit(ctx: CanvasRenderingContext2D, src: CanvasImageSource, sw: number, sh: number) {
		const { s, dx, dy } = fit(sw, sh, p.w, p.h);
		ctx.drawImage(src, dx, dy, sw * s, sh * s);
	}

	$effect(() => {
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<canvas bind:this={cv} width={p.w} height={p.h} class="h-full w-full object-contain"></canvas>
