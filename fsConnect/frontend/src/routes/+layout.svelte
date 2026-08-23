<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<!--
	Skeleton 3 removed AppShell and AppBar, so the shell is plain markup now.
	AppShell was a full-height flex column holding a fixed header above a
	scrolling content region; AppBar was a padded row with lead/trail regions.
	Only the lead was ever filled in here, so the trail is dropped rather than
	carried over as an empty element.
-->
<div class="flex h-screen flex-col">
	<header class="preset-filled-surface-100-900 flex items-center gap-4 p-4">
		<strong class="text-xl uppercase">fsConnector</strong>
	</header>

	<main class="flex-1 overflow-y-auto">
		{@render children?.()}
	</main>
</div>
