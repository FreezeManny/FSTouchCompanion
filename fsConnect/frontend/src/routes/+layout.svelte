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

	import { ChangeFlightSim, ReconnectFlightSim } from '../../wailsjs/go/main/App';
	import { EventsOn } from '../../wailsjs/runtime/runtime';

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
		EventsOn('ConnectionStatus', (status: boolean) => {
			fsConnected = status; // Set value using store
			console.log('Flightsim Connected:', status);
		});
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
				
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>
