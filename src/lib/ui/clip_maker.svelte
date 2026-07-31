<script lang="ts">
	import { bmps, frame_at, sinks } from '$lib/media';
	import { add_clip, p, ui } from '$lib/project.svelte';
	import { tc } from '$lib/time';
	import { nudge } from './nudge';

	let a = $state(0);
	let b = $state(0);
	let focus = $state<'a' | 'b'>('a');
	let big: ImageBitmap | null = $state(null);
	let strip: (ImageBitmap | null)[] = $state([]);

	let cv_big: HTMLCanvasElement;

	let r = $derived(p.r.find((x) => x.i === ui.src_sel));
	let last = $derived(r ? Math.max(0, Math.round(r.d * r.f) - 1) : 0);
	let len = $derived(r?.k === 'p' ? b : b - a + 1);

	let token = 0;
	let strip_timer: ReturnType<typeof setTimeout>;

	$effect(() => {
		if (ui.mode !== 'c' || !r) return;
		if (r.k === 'p') {
			a = 0;
			b = Math.min(last, Math.round(r.f));
		} else {
			a = 0;
			b = Math.min(last, Math.round(r.f) - 1);
		}
		focus = 'a';
		refresh();
	});

	$effect(() => {
		if (!big || !cv_big) return;
		const ctx = cv_big.getContext('2d')!;
		const { width, height } = big;
		const s = Math.min(cv_big.width / width, cv_big.height / height);
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.fillRect(0, 0, cv_big.width, cv_big.height);
		ctx.drawImage(
			big,
			(cv_big.width - width * s) / 2,
			(cv_big.height - height * s) / 2,
			width * s,
			height * s
		);
	});

	function paint_bmp(node: HTMLCanvasElement, bmp: ImageBitmap | null) {
		if (!bmp) return;
		const ctx = node.getContext('2d')!;
		ctx.drawImage(bmp, 0, 0, node.width, node.height);
	}

	function refresh() {
		if (!r) return;
		const mine = ++token;
		const f = focus === 'a' ? a : b;
		if (r.k === 'p') {
			const bmp = bmps.get(r.i);
			if (bmp) big = bmp;
			return;
		}
		(async () => {
			const smp = await frame_at(r.i, f, r.f);
			if (mine !== token) return void smp?.close?.();
			if (smp && 'toVideoFrame' in smp) {
				if (big && big !== bmps.get(r.i)) big.close();
				const vf = smp.toVideoFrame();
				big = await createImageBitmap(vf);
				vf.close();
				smp.close();
			}
		})();
		clearTimeout(strip_timer);
		strip_timer = setTimeout(refresh_strip, 120);
	}

	async function refresh_strip() {
		if (!r || r.k === 'p') return;
		const sink = sinks.get(r.i);
		if (!sink) return;
		const f = focus === 'a' ? a : b;
		const offsets = [-3, -2, -1, 0, 1, 2, 3];
		const gen = sink.samplesAtTimestamps(offsets.map((o) => (f + o + 0.5) / r.f));
		const mine = token;
		const results: (ImageBitmap | null)[] = [];
		for await (const smp of gen) {
			if (!smp || !('toVideoFrame' in smp)) {
				results.push(null);
				continue;
			}
			const vf = smp.toVideoFrame();
			const bmp = await createImageBitmap(vf, {
				resizeWidth: 96,
				resizeQuality: 'low'
			});
			vf.close();
			smp.close();
			results.push(bmp);
		}
		if (mine !== token) {
			for (const b of results) b?.close();
			return;
		}
		for (const old of strip) old?.close();
		strip = results;
	}

	function on_keydown(e: KeyboardEvent) {
		if (!r) return;
		const d = e.shiftKey ? 10 : 1;
		switch (e.key) {
			case 's':
			case 'S':
				focus = 'a';
				refresh();
				break;
			case 'e':
			case 'E':
				focus = 'b';
				refresh();
				break;
			case 'ArrowLeft': {
				const [na, nb] = nudge(a, b, focus, -d, last);
				a = na;
				b = nb;
				refresh();
				break;
			}
			case 'ArrowRight': {
				const [na, nb] = nudge(a, b, focus, d, last);
				a = na;
				b = nb;
				refresh();
				break;
			}
			case 'a':
			case 'A':
				if (r.k === 'p') add_clip(r.i, 0, b);
				else add_clip(r.i, a, b);
				ui.mode = 'e';
				break;
			case 'Escape':
				ui.mode = 'e';
				break;
		}
	}

	function nudge_to(d: number) {
		const [na, nb] = nudge(a, b, focus, d, last);
		a = na;
		b = nb;
		refresh();
	}
</script>

<svelte:window onkeydown={on_keydown} />

<div class="flex h-full flex-col items-center justify-center gap-4 bg-bg p-6">
	<canvas
		bind:this={cv_big}
		width={p.w}
		height={p.h}
		class="max-h-[50vh] w-full rounded object-contain ring-2 {focus === 'a'
			? 'ring-beat'
			: 'ring-sel'}"
	></canvas>

	{#if r?.k !== 'p'}
		<div class="flex gap-1">
			{#each strip as bmp, i (i)}
				<div class="flex flex-col items-center gap-1">
					<canvas
						width={96}
						height={54}
						class="h-16 w-24 rounded object-cover {focus === 'a' && i === 3
							? 'ring-2 ring-beat'
							: focus === 'b' && i === 3
								? 'ring-2 ring-sel'
								: ''}"
						use:paint_bmp={bmp}
					></canvas>
					<span class="font-mono text-[10px] text-dim">{(focus === 'a' ? a : b) + i - 3}</span>
				</div>
			{/each}
		</div>
	{/if}

	<div data-r="readout" class="font-mono text-sm text-ink tabular-nums">
		in {String(a).padStart(6, '0')} · out {String(b).padStart(6, '0')} · len {len}f · {tc(
			len,
			r?.f ?? p.f
		)}
	</div>

	<div class="flex gap-2">
		<button
			class="min-h-8 rounded bg-panel2 px-4 font-mono text-xs text-dim ring-1 ring-line"
			onclick={() => {
				focus = 'a';
				refresh();
			}}>in <kbd class="ml-1 rounded bg-bg px-1 text-[10px]">s</kbd></button
		>
		<button
			class="min-h-8 rounded bg-panel2 px-4 font-mono text-xs text-dim ring-1 ring-line"
			onclick={() => {
				focus = 'b';
				refresh();
			}}>out <kbd class="ml-1 rounded bg-bg px-1 text-[10px]">e</kbd></button
		>
		<button
			class="min-h-8 rounded bg-panel2 px-4 font-mono text-xs text-dim ring-1 ring-line"
			onclick={() => nudge_to(-1)}>◀</button
		>
		<button
			class="min-h-8 rounded bg-panel2 px-4 font-mono text-xs text-dim ring-1 ring-line"
			onclick={() => nudge_to(1)}>▶</button
		>
		<button
			class="min-h-8 rounded bg-sel px-4 font-mono text-xs text-bg"
			onclick={() => {
				if (!r) return;
				if (r.k === 'p') add_clip(r.i, 0, b);
				else add_clip(r.i, a, b);
				ui.mode = 'e';
			}}>add clip <kbd class="ml-1 rounded bg-bg/30 px-1 text-[10px]">a</kbd></button
		>
		<button
			class="min-h-8 rounded bg-panel2 px-4 font-mono text-xs text-dim ring-1 ring-line"
			onclick={() => (ui.mode = 'e')}
			>cancel <kbd class="ml-1 rounded bg-bg px-1 text-[10px]">esc</kbd></button
		>
	</div>
</div>
