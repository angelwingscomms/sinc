<script lang="ts">
	import { p, ui, src_of, clip_of, move_item, add_track } from '$lib/project.svelte';
	import { thumb, peaks, bufs } from '$lib/media';
	import { drop_pos } from '$lib/drop';
	import { tc } from '$lib/time';
	import MarkerRail from './marker_rail.svelte';
	import type { item } from '$lib/types';

	let lane_el = $state<HTMLDivElement | null>(null);
	let grab: { px: number; p0: number; t0: string } | null = null;

	const x_of = (f: number) => (f - ui.scroll) * ui.zoom;
	const f_of = (px: number) => Math.round(px / ui.zoom) + ui.scroll;

	const RULER_STEPS = [1, 2, 5, 10, 15, 30, 60, 150, 300, 600, 1800, 3600];
	let ruler_step = $derived(RULER_STEPS.find((s) => s * ui.zoom >= 60) ?? 3600);
	const ruler_ticks = $derived.by(() => {
		const step = ruler_step;
		const n = Math.ceil((ui.scroll + (lane_el?.clientWidth ?? 800) / ui.zoom + 1) / step) + 1;
		return Array.from({ length: Math.max(0, n) }, (_, i) => i);
	});

	function seek(f: number) {
		ui.pf = Math.max(0, f);
	}

	function handle_wheel(e: WheelEvent) {
		e.preventDefault();
		if (e.ctrlKey || e.metaKey) {
			const at = f_of(e.offsetX);
			ui.zoom = Math.min(40, Math.max(0.25, ui.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
			ui.scroll = Math.max(0, at - e.offsetX / ui.zoom);
		} else {
			ui.scroll = Math.max(0, ui.scroll + (e.deltaX || e.deltaY) / ui.zoom);
		}
	}

	function drag_start(e: PointerEvent, x: item) {
		ui.sel = x.i;
		grab = { px: e.clientX, p0: x.p, t0: x.t };
		try {
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
		} catch {
			/* test env may not support pointer capture */
		}
	}

	function drag_move(e: PointerEvent) {
		if (!grab) return;
		const x = p.x.find((v) => v.i === ui.sel);
		if (!x) return;
		const want = grab.p0 + Math.round((e.clientX - grab.px) / ui.zoom);
		const cands = [
			0,
			...p.m.map((m) => m.p),
			...p.x.filter((v) => v.i !== ui.sel).flatMap((v) => [v.p, v.p + v.l])
		];
		const tol = Math.max(1, Math.round(8 / ui.zoom));
		x.p = drop_pos(want, x.l, cands, tol, !!ui.snap);
		if (!lane_el) return;
		const lanes = lane_el?.querySelectorAll<HTMLElement>('[data-tid]');
		if (!lanes) return;
		for (const lane of lanes) {
			const r = lane.getBoundingClientRect();
			if (e.clientY >= r.top && e.clientY < r.bottom) {
				const tid = lane.dataset.tid!;
				const new_t = p.t.find((t) => t.i === tid);
				const old_t = p.t.find((t) => t.i === x.t);
				if (new_t && old_t && new_t.k === old_t.k) x.t = tid;
				break;
			}
		}
	}

	function drag_end() {
		if (!grab) return;
		const x = p.x.find((v) => v.i === ui.sel);
		if (!x) return;
		if (x.p !== grab.p0 || x.t !== grab.t0) {
			const fp = x.p;
			const ft = x.t;
			x.p = grab.p0;
			x.t = grab.t0;
			move_item(x.i, ft, fp);
		}
		grab = null;
	}

	$effect(() => {
		if (!ui.playing || !lane_el || grab) return;
		const px = x_of(ui.pf);
		if (px > lane_el.clientWidth * 0.85)
			ui.scroll = Math.max(0, ui.scroll + Math.round((lane_el.clientWidth * 0.8) / ui.zoom));
	});

	function thumb_act(el: HTMLCanvasElement, x: item) {
		const c = clip_of(x);
		if (!c) return { destroy() {} };
		const r = src_of(c);
		if (!r) return { destroy() {} };
		const fps = r.f ?? p.f;
		thumb(c.s, c.a, fps).then((bmp) => {
			if (!bmp || !el.isConnected) return;
			const w = el.parentElement!.clientWidth;
			const h = el.parentElement!.clientHeight;
			el.width = w;
			el.height = h;
			const ctx = el.getContext('2d')!;
			ctx.globalAlpha = 0.12;
			for (let bx = 0; bx < w; bx += bmp.width)
				ctx.drawImage(bmp, bx, 0, Math.min(bmp.width, w - bx), h);
			ctx.globalAlpha = 1;
		});
		return { destroy() {} };
	}

	function peaks_act(el: HTMLCanvasElement, x: item) {
		const c = clip_of(x);
		if (!c) return { destroy() {} };
		const r = src_of(c);
		if (!r) return { destroy() {} };
		const buf = bufs.get(r.i);
		if (!buf) return { destroy() {} };
		const w = el.parentElement!.clientWidth;
		const h = el.parentElement!.clientHeight;
		el.width = w;
		el.height = h;
		const ctx = el.getContext('2d')!;
		const pks = peaks(buf, w);
		ctx.fillStyle = 'oklch(0.35 0 0)';
		ctx.fillRect(0, 0, w, h);
		ctx.strokeStyle = 'oklch(0.65 0 0)';
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

	function toggle_mute(tid: string) {
		const t = p.t.find((v) => v.i === tid);
		if (t) t.m = t.m ? 0 : 1;
	}

	function toggle_hide(tid: string) {
		const t = p.t.find((v) => v.i === tid);
		if (t) t.h = t.h ? 0 : 1;
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1">
		<div class="flex w-28 flex-shrink-0 flex-col border-r border-line bg-panel">
			<div class="h-6"></div>
			<div class="h-5 border-b border-line px-2 font-mono text-[10px] leading-5 text-dim">
				markers
			</div>
			<div class="flex-1 overflow-y-auto">
				{#each p.t as t (t.i)}
					<div class="flex h-14 items-center gap-1 border-b border-line px-2">
						<span class="flex-1 truncate font-mono text-xs">{t.n}</span>
						<button
							class="h-6 w-6 rounded font-mono text-xs"
							class:text-beat={t.m}
							onclick={() => toggle_mute(t.i)}
							aria-label="mute {t.n}">m</button
						>
						<button
							class="h-6 w-6 rounded font-mono text-xs"
							class:text-beat={t.h}
							onclick={() => toggle_hide(t.i)}
							aria-label="hide {t.n}">h</button
						>
					</div>
				{/each}
			</div>
			<div class="mt-auto flex gap-1 border-t border-line p-1">
				<button class="rounded px-1 font-mono text-xs text-dim" onclick={() => add_track('v')}
					>+v</button
				>
				<button class="rounded px-1 font-mono text-xs text-dim" onclick={() => add_track('a')}
					>+a</button
				>
			</div>
		</div>

		<div
			role="application"
			class="relative min-w-0 flex-1 overflow-auto bg-panel"
			bind:this={lane_el}
			onwheel={handle_wheel}
			onpointermove={drag_move}
			onpointerup={drag_end}
		>
			<div
				class="pointer-events-none absolute top-0 z-20 w-px bg-beat"
				style="left:{x_of(ui.pf)}px;bottom:0"
			></div>

			<div
				role="button"
				tabindex="0"
				class="sticky top-0 z-10 h-6 border-b border-line bg-panel"
				onclick={(e) => seek(f_of(e.offsetX))}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') seek(f_of(0));
				}}
			>
				{#each ruler_ticks as i (i)}
					{@const f = Math.floor(ui.scroll / ruler_step) * ruler_step + i * ruler_step}
					{#if f >= 0}
						<div class="absolute top-0 h-full" style="left:{x_of(f)}px">
							<div class="h-full w-px bg-line"></div>
							<span class="ml-1 font-mono text-[10px] text-dim">{tc(f, p.f)}</span>
						</div>
					{/if}
				{/each}
			</div>

			<div class="sticky top-6 z-10 border-b border-line bg-panel">
				<MarkerRail />
			</div>

			{#each p.t as t (t.i)}
				{@const items = p.x.filter((x) => x.t === t.i)}
				{@const rkind = t.k === 'a' ? 'a' : 'v'}
				<div class="relative h-14 border-b border-line" data-tid={t.i}>
					{#each items as x (x.i)}
						{@const c = clip_of(x)}
						{@const ci = c ? p.c.indexOf(c) : -1}
						<div
							role="button"
							tabindex="0"
							class="absolute inset-y-1 overflow-hidden rounded bg-panel2 ring-1 ring-line"
							class:ring-2={ui.sel === x.i}
							class:ring-sel={ui.sel === x.i}
							style="left:{x_of(x.p)}px;width:{x.l * ui.zoom}px"
							onpointerdown={(e) => drag_start(e, x)}
						>
							{#if rkind === 'a'}
								<canvas use:peaks_act={x} class="h-full w-full"></canvas>
							{:else}
								<canvas use:thumb_act={x} class="h-full w-full"></canvas>
							{/if}
							<div
								class="absolute bottom-1 left-1 rounded bg-bg/50 px-1 font-mono text-[10px] text-dim"
							>
								{ci}:{x.l}f
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>

	<div class="flex items-center gap-3 border-t border-line bg-panel px-2 py-1">
		<button class="rounded px-1 font-mono text-xs text-dim" onclick={() => add_track('v')}
			>+v</button
		>
		<button class="rounded px-1 font-mono text-xs text-dim" onclick={() => add_track('a')}
			>+a</button
		>
		<span class="font-mono text-xs text-dim">{ui.zoom}x</span>
		<button
			class="rounded px-1 font-mono text-xs"
			class:text-sel={ui.snap}
			onclick={() => (ui.snap = ui.snap ? 0 : 1)}>snap {ui.snap}</button
		>
	</div>
</div>
