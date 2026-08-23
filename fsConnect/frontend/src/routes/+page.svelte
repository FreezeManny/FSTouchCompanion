<script lang="ts">
	import { onMount } from 'svelte';
	import { EventsOn } from '$lib/wailsjs/runtime/runtime';
	import { ChangeFlightSim, ReconnectFlightSim } from '$lib/wailsjs/go/main/App';

	// Plain `let` under Svelte 5 runes is not reactive, so every value the Wails
	// event callbacks below write to has to be $state. These were a mix of
	// writable stores and a bare `let` before; runes make the stores redundant.
	let selectedAircraft = $state('-----');
	let connectedClients = $state(0);
	let fsConnected = $state(false);
	let selectedSim = $state('xplane12');

	function handleSimChange(event: Event & { currentTarget: HTMLSelectElement }) {
		selectedSim = event.currentTarget.value;
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

		// EventsOn hands back its own unsubscribe, so the listeners are torn down
		// with the component instead of outliving it.
		const unsubscribe = [
			EventsOn('ConnectionStatus', (status: boolean) => {
				console.log('Flightsim Connected:', status);
				fsConnected = status;
			}),

			EventsOn('ConnectionCount', (count: number) => {
				connectedClients = count;
				console.log('Connected Clients:', count);
			}),

			EventsOn('AircraftName', (name: string) => {
				name = name.replace(/\0/g, '').trim(); // Remove null characters and trim whitespace
				console.log('Aircraft Name:', name);
				selectedAircraft = name;
			})
		];

		return () => unsubscribe.forEach((off) => off());
	});
</script>

<!--
	Skeleton 5 class changes: input-group/input-group-shim became
	field-group/label, variant-filled became preset-filled, and `card` now only
	sets a corner radius, so the background comes from a preset. The dropped
	`rounded shadow` were a Tailwind 3 spelling and redundant next to `card`.
-->
<div class="card preset-filled-surface-100-900 m-2 flex space-x-4 p-4">
	<div class="field-group grid-cols-[auto_1fr_auto]">
		<div class="label">Simulator</div>
		<select class="select" onchange={handleSimChange} bind:value={selectedSim}>
			<option value="xplane12">X-Plane 12</option>
			<option value="msfs">MSFS</option>
		</select>
		<div style="background-color: {fsConnected ? 'green' : 'red'}"></div>
	</div>
	<button type="button" class="btn preset-filled flex items-center" onclick={() => ReconnectFlightSim()}>
		Reconnect
	</button>
</div>

<div class="flex space-x-4 p-2">
	<div class="card preset-filled-surface-100-900 w-full p-4">
		<div><strong>Selected Aircraft:<br /></strong> {selectedAircraft}</div>
	</div>
	<div class="card preset-filled-surface-100-900 w-full p-4">
		<div><strong>Connected Clients:</strong> {connectedClients}</div>
	</div>
</div>
<!-- 
<div class="card preset-filled-surface-100-900 p-4 m-2">
	<button type="button" class="btn preset-filled" onclick={() => (logOpen = !logOpen)}>
		{#if logOpen}
			<span>Close Log</span>
		{:else}
			<span>Open Log</span>
		{/if}
	</button>
	{#if logOpen}
		<div class="card preset-filled-surface-200-800 p-2 m-2">a;lsdkfj;aldskfj;saldkfj;asldkfj;asdlkfj;sadlkfja;sdlkfj</div>
	{/if}
</div>
-->
