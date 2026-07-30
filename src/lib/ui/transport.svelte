<script lang="ts">
	import { p, ui } from '$lib/project.svelte';
	import { tc } from '$lib/time';

	let { onact }: { onact: (a: string) => void } = $props();
</script>

<div class="flex items-center gap-2 bg-panel px-3 py-2">
	<button
		class="min-h-8 rounded bg-panel2 px-3 font-mono text-xs text-dim hover:bg-line"
		onclick={() => onact('start')}>|&#x3c;</button
	>
	<button
		class="min-h-8 rounded bg-panel2 px-3 font-mono text-xs text-dim hover:bg-line"
		onclick={() => onact('prev')}>&#x3c;|</button
	>
	<button
		class="min-h-8 rounded bg-panel2 px-3 font-mono text-xs hover:bg-line"
		class:text-beat={ui.playing}
		onclick={() => onact('play')}>{ui.playing ? '||' : '▶'}</button
	>
	<button
		class="min-h-8 rounded bg-panel2 px-3 font-mono text-xs text-dim hover:bg-line"
		onclick={() => onact('next')}>|&#x3e;</button
	>
	<button
		class="min-h-8 rounded bg-panel2 px-3 font-mono text-xs text-dim hover:bg-line"
		onclick={() => onact('end')}>&#x3e;|</button
	>

	<div class="h-5 w-px bg-line"></div>

	<button
		class="min-h-8 rounded bg-panel2 px-3 font-mono text-xs text-dim hover:bg-line"
		onclick={() => onact('mark')}
		>mark <kbd class="ml-1 rounded bg-bg px-1 text-[10px]">b</kbd></button
	>

	<div class="flex-1"></div>

	<button
		class="min-h-8 rounded px-3 font-mono text-xs hover:bg-line"
		class:bg-beat={ui.snap}
		class:text-bg={ui.snap}
		class:bg-panel2={!ui.snap}
		class:text-dim={!ui.snap}
		onclick={() => onact('snap')}>snap</button
	>

	<span class="font-mono text-sm text-ink tabular-nums">{tc(ui.pf, p.f)}</span>
</div>
