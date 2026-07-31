<script lang="ts">
	import { from_event, type act } from '$lib/keys.svelte';
	import { p, ui, commit, undo, redo, add_marker, del_item, load_proj } from '$lib/project.svelte';
	import { probe, clear_media } from '$lib/media';
	import { save, restore, wipe } from '$lib/persist.svelte';
	import Settings from '$lib/ui/settings.svelte';
	import Library from '$lib/ui/library.svelte';
	import Timeline from '$lib/ui/timeline.svelte';
	import { tc } from '$lib/time';
	import Viewport from '$lib/ui/viewport.svelte';
	import Transport from '$lib/ui/transport.svelte';
	import ClipMaker from '$lib/ui/clip_maker.svelte';
	import RenderBar from '$lib/ui/render_bar.svelte';

	let show_settings = $state(false);
	let vp = $state<Viewport | undefined>();

	let save_timer: ReturnType<typeof setTimeout>;

	$effect(() => {
		JSON.stringify(p);
		clearTimeout(save_timer);
		save_timer = setTimeout(save, 800);
	});

	$effect(() => {
		void restore();
		return () => clearTimeout(save_timer);
	});

	function new_proj() {
		if (!confirm('discard current project?')) return;
		clear_media();
		load_proj({
			f: 30,
			w: 1920,
			h: 1080,
			r: [],
			c: [],
			t: [
				{ i: 'v1', k: 'v', n: 'v1', m: 0, h: 0 },
				{ i: 'a1', k: 'a', n: 'a1', m: 0, h: 0 }
			],
			m: [],
			x: []
		});
		ui.pf = 0;
		ui.playing = false;
		ui.mode = 'e';
		ui.sel = '';
		ui.src_sel = '';
		void wipe();
	}

	async function handle_import(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		if (!target.files) return;
		for (const f of target.files) {
			commit();
			p.r.push(await probe(f));
		}
		target.value = '';
	}

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
			case 'del':
				if (ui.sel) del_item(ui.sel);
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
		<button class="rounded bg-panel2 px-2 py-1 font-mono text-xs text-dim" onclick={new_proj}
			>new</button
		>
		<RenderBar />
		<label
			class="cursor-pointer rounded bg-panel2 px-2 py-1 font-mono text-xs text-dim hover:text-ink"
			>import
			<input
				type="file"
				multiple
				accept="video/*,audio/*,image/*"
				class="hidden"
				onchange={handle_import}
			/></label
		>
		<button
			class="rounded bg-panel2 px-2 py-1 font-mono text-xs text-dim"
			onclick={() => (show_settings = true)}>keys</button
		>
		<span class="font-mono text-sm tabular-nums">{tc(ui.pf, p.f)}</span>
	</header>

	<main class="grid min-h-0 grid-cols-[15rem_1fr] gap-px bg-line">
		<aside data-r="library" class="min-h-0 overflow-y-auto bg-panel p-3"><Library /></aside>
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

	<section data-r="timeline" class="h-80 overflow-hidden bg-panel"><Timeline /></section>
</div>

<Settings show={show_settings} onclose={() => (show_settings = false)} />
