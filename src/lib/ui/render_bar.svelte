<script lang="ts">
	import { render } from '$lib/render';
	import { total_frames } from '$lib/project.svelte';

	let open = $state(false);
	let progress = $state(0);
	let busy = $state(false);
	let err = $state('');

	async function start() {
		busy = true;
		err = '';
		progress = 0;
		try {
			const blob = await render((d) => (progress = d));
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'sinc.mp4';
			a.click();
			URL.revokeObjectURL(url);
			progress = 1;
		} catch (e) {
			err = (e as Error).message;
		}
		busy = false;
	}
</script>

<button
	class="rounded bg-panel2 px-2 py-1 font-mono text-xs text-dim"
	disabled={busy || total_frames() === 0}
	onclick={() => (open = true)}>render</button
>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-bg/60"
		role="dialog"
		aria-label="render dialog"
	>
		<div class="flex w-80 flex-col gap-3 rounded bg-panel p-4 ring-1 ring-line">
			<h2 class="font-mono text-sm text-ink">render</h2>
			<div class="font-mono text-xs text-dim">{total_frames()} frames</div>

			{#if err}
				<div class="font-mono text-xs text-beat">{err}</div>
			{/if}

			<div class="h-2 w-full overflow-hidden rounded-full bg-panel2">
				<div
					class="h-full rounded-full bg-beat transition-all duration-150"
					style="width:{progress * 100}%"
				></div>
			</div>

			<div class="flex justify-end gap-2">
				<button
					class="rounded bg-panel2 px-3 py-1 font-mono text-xs text-dim"
					disabled={busy}
					onclick={() => {
						if (!busy) {
							open = false;
							progress = 0;
							err = '';
						}
					}}>close</button
				>
				<button
					class="rounded bg-sel px-3 py-1 font-mono text-xs text-bg"
					disabled={busy}
					onclick={start}>{busy ? `${Math.round(progress * 100)}%` : 'start'}</button
				>
			</div>
		</div>
	</div>
{/if}
