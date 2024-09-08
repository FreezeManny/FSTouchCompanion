<script>
	import { onMount } from 'svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	var frame = false;

	onMount(async () => {
		checkAlive();
	});

	async function checkAlive() {
		try {
			const response = await fetch('http://localhost:8083/#/mcdu');
			//console.log("Server There");
			frame = true;
		} catch (error) {
			//console.log("Failed to fetch data:", error);
		}
	}

	setInterval(checkAlive, 2000);

	const loadingValue = 'Connecting...';
</script>

{#if frame}
	<iframe title="MCDU" src="http://localhost:8083/#/mcdu" style="border: none;" class="w-full h-full" />
{:else}
	<div class="h-full flex items-center justify-center">
		<div class="flex flex-col items-center">
			<ProgressRadial class="w-56 pb-5" />
			<h1 class="h1">Connecting....</h1>
      <p>Make sure the Fenix Aircraft is running</p>
		</div>
	</div>
{/if}
