<script lang="ts">

	let selectedAircraft: string = 'Cessna 172';
	let connectedClients: number = 3;

	let logOpen: boolean = false;
</script>

<div class="card p-4 m-2 d-flex justify-content-between">
	<div>Selected Aircraft: {selectedAircraft}</div>
	<div>Connected Clients: {connectedClients}</div>
</div>

<div class="card p-4 m-2">
	<button type="button" class="btn variant-filled" on:click={() => (logOpen = !logOpen)}
		>{#if logOpen}
			<span>Close Log</span>
		{:else}
			<span>Open Log</span>
		{/if}
	</button>
	{#if logOpen}
		<div class="card p-2 m-2">a;lsdkfj;aldskfj;saldkfj;asldkfj;asdlkfj;sadlkfja;sdlkfj</div>
	{/if}
</div>
