<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store'; // Import writable store
	import { EventsOn } from '../../wailsjs/runtime/runtime';
	import { ChangeFlightSim, ReconnectFlightSim } from '../../wailsjs/go/main/App';
	//import { FsData } from "../../wailsjs/go/"

	const selectedAircraft = writable('-----'); // Use writable store
	const connectedClients = writable(0); // Use writable store

	let fsConnected: boolean = false;
	let selectedSim: string = 'xplane12';

	function handleSimChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedSim = target.value;
		ChangeFlightSim(selectedSim)
			.then((response) => {
				console.log('Flight simulator changed:', response);
			})
			.catch((error) => {
				console.error('Error changing flight simulator:', error);
			});
	}

	onMount(() => {
		ReconnectFlightSim();

		EventsOn('ConnectionStatus', (status: boolean) => {
			console.log('Flightsim Connected:', status);
			fsConnected = status; // Set value using store
			console.log('Flightsim Connected:', status);
		});

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

<div class="flex space-x-4 p-4 card p-4 m-2 rounded shadow">
	<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
		<div class="input-group-shim">Simulator</div>
		<select on:change={handleSimChange} bind:value={selectedSim}>
			<option value="xplane12">X-Plane 12</option>
			<option value="msfs2020">MSFS 2020</option>
		</select>
		<div style="background-color: {fsConnected ? 'green' : 'red'}"></div>
	</div>
	<button
		type="button"
		class="btn variant-filled flex items-center"
		on:click={() => ReconnectFlightSim()}
	>
		Reconnect
	</button>
</div>

<div class="flex space-x-4 p-2">
	<div class="card p-4 rounded shadow w-full">
		<div><strong>Selected Aircraft:<br></strong> {$selectedAircraft}</div>
	</div>
	<div class="card p-4 rounded shadow w-full">
		<div><strong>Connected Clients:</strong> {$connectedClients}</div>
	</div>
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
