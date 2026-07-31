<script lang="ts">
	import { p, ui, del_marker, snap_group } from '$lib/project.svelte';

	let { lane = 0 } = $props<{ lane?: number }>();

	const groups = $derived([...new Set(p.m.map((m) => m.g))].sort());
	const x_of = (f: number) => (f - ui.scroll) * ui.zoom;
	const visible = $derived.by(() => {
		if (!lane) return null;
		return { a: ui.scroll, b: ui.scroll + lane / ui.zoom };
	});
	const shown = (g: string) => {
		if (ui.hid[g]) return [];
		const v = visible;
		return v
			? p.m.filter((m) => m.g === g && m.p >= v.a && m.p <= v.b)
			: p.m.filter((m) => m.g === g);
	};
</script>

{#each groups as g (g)}
	<div
		class="relative h-5 border-b border-line {g !== '' ? 'bg-beat/40' : ''}"
		class:opacity-40={ui.hid[g]}
	>
		<button
			class="absolute top-0 left-1 z-10 h-5 font-mono text-[10px] leading-5"
			class:text-dim={ui.hid[g]}
			class:line-through={ui.hid[g]}
			title="toggle {g || 'taps'}"
			onclick={() => (ui.hid[g] ? delete ui.hid[g] : (ui.hid[g] = 1))}
			aria-label="toggle {g || 'taps'}">{g || 'taps'}</button
		>
		<button
			class="absolute top-0 right-1 z-10 h-5 px-1 font-mono text-[10px] leading-5 text-dim hover:text-ink"
			title="snap video clips to {g || 'taps'}"
			onclick={() => snap_group(g)}
			aria-label="snap clips to {g || 'taps'}">snap</button
		>
		{#each shown(g) as m (m.p)}
			<button
				class="mk absolute top-0 h-5 w-0.5 bg-beat"
				class:hot={ui.playing && Math.abs(m.p - ui.pf) < 2}
				style="left:{x_of(m.p)}px"
				title={String(m.p)}
				onclick={() => del_marker(m.p, g)}
				aria-label="marker at frame {m.p}"
			></button>
		{/each}
	</div>
{/each}

<style>
	@reference 'tailwindcss';
	.mk {
		opacity: 0.5;
		transform-origin: center;
		transition:
			opacity 0.22s var(--ease-snap),
			transform 0.22s var(--ease-snap);
	}
	.mk.hot {
		opacity: 1;
		transform: scaleX(4);
	}
</style>
