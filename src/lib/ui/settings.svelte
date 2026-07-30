<script lang="ts">
	import { binds, def, reset_binds, set_bind, type act } from '$lib/keys.svelte';

	let { show = false, onclose }: { show?: boolean; onclose?: () => void } = $props();

	let dialog: HTMLDialogElement;
	let capturing = $state<act | null>(null);

	$effect(() => {
		if (show) dialog.showModal();
	});

	function start_capture(a: act) {
		capturing = a;
	}

	function on_dialog_keydown(e: KeyboardEvent) {
		if (!capturing) return;
		e.stopPropagation();
		e.preventDefault();
		set_bind(capturing, e.key);
		capturing = null;
	}

	function close_dialog() {
		capturing = null;
		dialog.close();
		onclose?.();
	}

	const items = Object.keys(def) as act[];
</script>

<dialog
	bind:this={dialog}
	class="w-96 rounded-panel bg-panel p-4 text-ink"
	onkeydown={on_dialog_keydown}
	{onclose}
>
	<h2 class="mb-4 font-mono text-sm text-dim">keyboard shortcuts</h2>
	<div class="space-y-1">
		{#each items as a (a)}
			<div class="flex items-center justify-between rounded bg-panel2 px-3 py-2">
				<span class="font-mono text-xs text-ink">{a}</span>
				<button
					class="min-w-12 rounded bg-bg px-2 py-1 font-mono text-xs text-dim ring-1 ring-line"
					class:ring-beat={capturing === a}
					onclick={() => start_capture(a)}
				>
					{capturing === a ? '…' : binds[a]}
				</button>
			</div>
		{/each}
	</div>
	<div class="mt-4 flex gap-2">
		<button
			class="rounded bg-bg px-3 py-1 font-mono text-xs text-dim ring-1 ring-line"
			onclick={reset_binds}>reset</button
		>
		<div class="flex-1"></div>
		<button class="rounded bg-beat px-3 py-1 font-mono text-xs text-bg" onclick={close_dialog}
			>close</button
		>
	</div>
</dialog>
