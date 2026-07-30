<script lang="ts">
	import { p, ui, del_marker } from '$lib/project.svelte';

	const groups = $derived([...new Set(p.m.map((m) => m.g))].sort());
	const x_of = (f: number) => (f - ui.scroll) * ui.zoom;
</script>

{#each groups as g (g)}
	<div class="relative h-5 border-b border-line">
		<span class="absolute top-0 left-1 z-10 font-mono text-[10px] leading-5 text-dim">
			{g || 'taps'}
		</span>
		{#each p.m.filter((m) => m.g === g) as m (m.p)}
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
