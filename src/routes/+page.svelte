<script lang="ts">
	import { p, ui } from '$lib/project.svelte';
	import { tc } from '$lib/time';
</script>

<div class="grid h-full grid-rows-[auto_1fr_auto] gap-px bg-line">
	<header data-r="topbar" class="flex items-center gap-3 bg-panel px-3 py-2">
		<span class="font-mono text-sm tracking-widest text-beat">sinc</span>
		<span class="font-mono text-xs text-dim">{p.w}×{p.h} · {p.f}fps</span>
		<div class="flex-1"></div>
		<span class="font-mono text-sm tabular-nums">{tc(ui.pf, p.f)}</span>
	</header>

	<main class="grid min-h-0 grid-cols-[15rem_1fr] gap-px bg-line">
		<aside data-r="library" class="min-h-0 overflow-y-auto bg-panel p-3">library</aside>
		<section data-r="stage" class="grid min-h-0 grid-rows-[1fr_auto] gap-px bg-line">
			<div class="min-h-0 bg-bg"></div>
			<div class="bg-panel px-3 py-2"></div>
		</section>
	</main>

	<section data-r="timeline" class="h-80 overflow-hidden bg-panel"></section>
</div>
