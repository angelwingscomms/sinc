<script lang="ts">
	import { from_event, type act } from '$lib/keys.svelte';
	import { p, ui, undo, redo, add_marker } from '$lib/project.svelte';
	import Settings from '$lib/ui/settings.svelte';
	import { tc } from '$lib/time';
	import Viewport from '$lib/ui/viewport.svelte';
	import Transport from '$lib/ui/transport.svelte';
	import MarkerRail from '$lib/ui/marker_rail.svelte';
	import ClipMaker from '$lib/ui/clip_maker.svelte';

	let show_settings = $state(false);
	let vp = $state<Viewport | undefined>();

	function act_do(a: act, shift = false) {
		switch (a) {
			case 'undo':
				undo();
				break;
			case 'redo':
				redo();
				break;
			case 'mark':
				add_marker(ui.pf);
				break;
			case 'snap':
				ui.snap = ui.snap ? 0 : 1;
				break;
			case 'play':
				if (!vp) return;
				if (ui.playing) vp.stop();
				else vp.play();
				break;
			case 'prev':
				if (ui.mode === 'c' || !vp) return;
				vp.seek(Math.max(0, ui.pf - (shift ? 10 : 1)));
				break;
			case 'next':
				if (ui.mode === 'c' || !vp) return;
				vp.seek(ui.pf + (shift ? 10 : 1));
				break;
			case 'clip':
				if (!ui.src_sel) return;
				ui.mode = 'c';
				break;
		}
	}

	function transport_act(a: string) {
		switch (a) {
			case 'play':
				act_do('play');
				break;
			case 'prev':
				act_do('prev');
				break;
			case 'next':
				act_do('next');
				break;
			case 'start':
				if (vp) vp.seek(0);
				break;
			case 'end':
				if (vp)
					vp.seek(
						Math.max(
							0,
							p.x.reduce((n, x) => Math.max(n, x.p + x.l), 0)
						)
					);
				break;
			case 'mark':
				act_do('mark');
				break;
			case 'snap':
				act_do('snap');
				break;
		}
	}

	function handle(e: KeyboardEvent) {
		const a = from_event(e);
		if (!a) return;
		e.preventDefault();
		if (ui.mode === 'c' && !['esc', 'add', 'in', 'out', 'prev', 'next'].includes(a)) return;
		if (ui.mode !== 'c' && ['in', 'out', 'add', 'esc'].includes(a)) return;
		act_do(a, e.shiftKey);
	}
</script>

<svelte:window onkeydown={handle} />

<div class="grid h-full grid-rows-[auto_1fr_auto] gap-px bg-line">
	<header data-r="topbar" class="flex items-center gap-3 bg-panel px-3 py-2">
		<span class="font-mono text-sm tracking-widest text-beat">sinc</span>
		<span class="font-mono text-xs text-dim">{p.w}×{p.h} · {p.f}fps</span>
		<div class="flex-1"></div>
		<button
			class="rounded bg-panel2 px-2 py-1 font-mono text-xs text-dim"
			onclick={() => (show_settings = true)}>keys</button
		>
		<span class="font-mono text-sm tabular-nums">{tc(ui.pf, p.f)}</span>
	</header>

	<main class="grid min-h-0 grid-cols-[15rem_1fr] gap-px bg-line">
		<aside data-r="library" class="min-h-0 overflow-y-auto bg-panel p-3">library</aside>
		<section data-r="stage" class="grid min-h-0 grid-rows-[1fr_auto] gap-px bg-line">
			<div class="min-h-0 bg-bg">
				{#if ui.mode === 'c'}
					<ClipMaker />
				{:else}
					<Viewport bind:this={vp} />
				{/if}
			</div>
			<div class="bg-panel px-3 py-2">
				<Transport onact={transport_act} />
			</div>
		</section>
	</main>

	<section data-r="timeline" class="h-80 overflow-hidden bg-panel"><MarkerRail /></section>
</div>

<Settings show={show_settings} onclose={() => (show_settings = false)} />
