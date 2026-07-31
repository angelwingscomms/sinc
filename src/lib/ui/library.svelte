<script lang="ts">
	import { p, ui, src_of, place, commit } from '$lib/project.svelte';
	import { del_src, thumb, bufs, peaks, probe } from '$lib/media';
	import { conv_fr, tc } from '$lib/time';
	import type { clip } from '$lib/types';

	let drag = $state(false);

	async function import_file(f: File) {
		commit();
		p.r.push(await probe(f));
	}

	function handle_drop(e: DragEvent) {
		e.preventDefault();
		drag = false;
		if (!e.dataTransfer?.files) return;
		for (const f of e.dataTransfer.files) import_file(f);
	}

	function select_src(sid: string) {
		ui.src_sel = sid;
	}

	function make_clip(sid: string) {
		ui.src_sel = sid;
		ui.mode = 'c';
	}

	function drop(c: clip) {
		const r = src_of(c);
		const kind = r?.k === 'a' ? 'a' : 'v';
		const t = p.t.find((t) => t.k === kind && !t.h) ?? p.t.find((t) => t.k === kind);
		if (t) place(c.i, t.i, ui.pf);
	}

	function thumb_act(el: HTMLCanvasElement, c: clip) {
		const r = src_of(c);
		const fps = r?.f ?? p.f;
		thumb(c.s, c.a, fps).then((bmp) => {
			if (!bmp || !el.isConnected) return;
			el.width = bmp.width;
			el.height = bmp.height;
			el.getContext('2d')!.drawImage(bmp, 0, 0);
		});
		return { destroy() {} };
	}

	function peaks_act(el: HTMLCanvasElement, c: clip) {
		const r = src_of(c);
		if (!r) return { destroy() {} };
		const buf = bufs.get(r.i);
		if (!buf) return { destroy() {} };
		const w = 160;
		const h = 48;
		el.width = w;
		el.height = h;
		const ctx = el.getContext('2d')!;
		const pks = peaks(buf, w);
		ctx.fillStyle = 'oklch(0.4 0 0)';
		ctx.fillRect(0, 0, w, h);
		ctx.strokeStyle = 'oklch(0.7 0 0)';
		ctx.beginPath();
		for (let i = 0; i < w; i++) {
			const lo = pks[i * 2];
			const hi = pks[i * 2 + 1];
			const cy = h / 2;
			ctx.moveTo(i, cy + lo * cy);
			ctx.lineTo(i, cy + hi * cy);
		}
		ctx.stroke();
		return { destroy() {} };
	}
</script>

<div
	role="region"
	class="flex flex-col gap-2"
	ondragover={(e) => {
		e.preventDefault();
		drag = true;
	}}
	ondragleave={() => (drag = false)}
	ondrop={handle_drop}
	class:ring-2={drag}
	class:ring-sel={drag}
>
	{#if p.r.length === 0}
		<div
			class="flex flex-1 items-center justify-center rounded border-2 border-dashed border-line p-6 text-center font-mono text-xs text-dim"
			class:border-sel={drag}
		>
			drop video, audio or images
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<span class="font-mono text-[11px] text-dim uppercase">sources</span>
		</div>

		{#each p.r as r (r.i)}
			<div
				class="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 font-mono text-xs"
				class:ring-1={ui.src_sel === r.i}
				class:ring-sel={ui.src_sel === r.i}
				role="button"
				tabindex="0"
				onclick={() => select_src(r.i)}
				ondblclick={() => make_clip(r.i)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') select_src(r.i);
				}}
			>
				<span class="w-6 text-center text-dim">{r.k}</span>
				<span class="flex-1 truncate">{r.n}</span>
				<span class="text-dim">{r.k === 'p' ? '' : tc(r.d, r.f)}</span>
				<button
					type="button"
					class="text-dim hover:text-ink"
					onclick={(e) => {
						e.stopPropagation();
						del_src(r.i);
					}}>×</button
				>
			</div>
		{/each}

		<span class="mt-2 font-mono text-[11px] text-dim uppercase">clips</span>

		<div class="grid grid-cols-2 gap-2">
			{#each p.c as c (c.i)}
				{@const r = src_of(c)}
				{@const len = conv_fr(c.b - c.a + 1, r?.f ?? p.f, p.f)}
				<button class="overflow-hidden rounded bg-panel2 text-left" onclick={() => drop(c)}>
					{#if r?.k === 'a'}
						<canvas use:peaks_act={c} class="h-12 w-full"></canvas>
					{:else}
						<canvas use:thumb_act={c} class="aspect-video w-full bg-panel2 object-cover"></canvas>
					{/if}
					<div class="px-2 py-1 font-mono text-[10px] text-dim">{len}f · {tc(len, p.f)}</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
