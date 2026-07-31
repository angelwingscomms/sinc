<script lang="ts">
	import { render } from '$lib/render';
	import { total_frames } from '$lib/project.svelte';

	let dialog_el: HTMLDialogElement;
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

	function reset() {
		progress = 0;
		err = '';
	}
</script>

<button
	class="rounded bg-panel2 px-2 py-1 font-mono text-xs text-dim"
	disabled={busy || total_frames() === 0}
	onclick={() => {
		reset();
		dialog_el.showModal();
	}}>render</button
>

<dialog
	bind:this={dialog_el}
	class="w-80 rounded bg-panel p-4 ring-1 ring-line backdrop:bg-bg/60 open:flex"
	onclose={reset}
>
	<div class="flex flex-col gap-3">
		<div class="font-mono text-sm text-ink">render</div>
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
				onclick={() => dialog_el.close()}>close</button
			>
			<button
				class="rounded bg-sel px-3 py-1 font-mono text-xs text-bg"
				disabled={busy}
				onclick={start}>{busy ? `${Math.round(progress * 100)}%` : 'start'}</button
			>
		</div>
	</div>
</dialog>
