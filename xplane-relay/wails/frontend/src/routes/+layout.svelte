<script lang="ts">
	import '../app.postcss';
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store'; // Import writable store



	// Highlight JS
	import hljs from 'highlight.js/lib/core';
	import 'highlight.js/styles/github-dark.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';
	import xml from 'highlight.js/lib/languages/xml'; // for HTML
	import css from 'highlight.js/lib/languages/css';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';

	hljs.registerLanguage('xml', xml); // for HTML
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	storeHighlightJs.set(hljs);

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	
	import { ChangeFlightSim, GetConnectionStatus, ReconnectFlightSim } from '../../wailsjs/go/main/App';


	let fsConnected: boolean = false;
	let selectedSim: string = 'xplane12';

	function handleSimChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedSim = target.value;
		ChangeFlightSim(selectedSim)
			.then(response => {
				console.log('Flight simulator changed:', response);
			})
			.catch(error => {
				console.error('Error changing flight simulator:', error);
			});
	}

	let interval: NodeJS.Timeout;

	onMount(() => {
		// Poll GetConnectionNumber every 500ms
		interval = setInterval(async () => {
			try {
				const status = await GetConnectionStatus();
				fsConnected = status; // Set value using store
				console.log('Flightsim Connected:', status);
			} catch (error) {
				console.error('Error fetching connection number:', error);
			}
		}, 1000);
	});

	// Cleanup interval on component destroy
	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">fsConnector</strong>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="input-group-shim">Simulator</div>
					<select on:change={handleSimChange} bind:value={selectedSim}>
						<option value="xplane12">X-Plane 12</option>
						<option value="msfs2020">MSFS 2020</option>
					</select>
                    <div style="background-color: {fsConnected ? 'green' : 'red'}"></div>
				</div>
				<button type="button" class="btn variant-filled flex items-center" on:click={() => ReconnectFlightSim()}>
					Reconnect
				</button>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>
