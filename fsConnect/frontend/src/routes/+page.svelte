<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store'; // Import writable store
	import { EventsOn } from '../../wailsjs/runtime';

	//import { GetConnectionCount, GetAircraftName } from '../../wailsjs/go/main/App';

	const selectedAircraft = writable('-----'); // Use writable store
	const connectedClients = writable(0); // Use writable store
	//let logOpen: boolean = false

	onMount(() => {
        EventsOn('ConnectionCount', (count: number) => {
            connectedClients.set(count); // Set value using store
            console.log('Connected Clients:', count);
        });

        EventsOn('AircraftName', (name: string) => {
            name = name.replace(/\0/g, '').trim(); // Remove null characters and trim whitespace
            console.log('Aircraft Name:', name);
            selectedAircraft.set(name); // Set value using store
        });
    });

</script>

<div class="card p-4 m-2 d-flex justify-content-between">
	<div>Selected Aircraft: {$selectedAircraft}</div>
	<div>Connected Clients: {$connectedClients}</div>
	<!-- Access value from store -->
</div>

<!-- 
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
-->
