<script lang="ts">
	import { onMount } from 'svelte';
	import { Events } from '@wailsapp/runtime';

	let selectedAircraft: string = 'Cessna 172';
	let connectedClients: number = 0;
	let logOpen: boolean = false;

	onMount(() => {
		Events.On('connectionCountChanged', (data: number) => {
			console.log('connectionCountChanged', data);
			connectedClients = data;
		});
	});
</script>

<div class="card p-4 m-2 d-flex justify-content-between">
	<div>Selected Aircraft: {selectedAircraft}</div>
	<div>Connected Clients: {connectedClients}</div>
</div>

<div class="card p-4 m-2">
	<button type="button" class="btn variant-filled" on:click={() => (logOpen = !logOpen)}>
		{#if logOpen}
			<span>Close Log</span>
		{:else}
			<span>Open Log</span>
		{/if}
	</button>
	{#if logOpen}
		<div class="card p-2 m-2">a;lsdkfj;aldskfj;saldkfj;asldkfj;asdlkfj;sadlkfja;sdlkfj</div>
	{/if}
</div>
