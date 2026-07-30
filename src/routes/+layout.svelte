<script lang="ts">
	import './layout.css';
	let { children } = $props();
</script>

<div class="h-dvh w-screen overflow-hidden bg-bg text-ink">
	{@render children()}
</div>
