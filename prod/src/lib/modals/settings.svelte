<script lang="js">
	import { getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();
    
	function confirmHandler() {
		//save Simbrief Username
		console.log('Confirm Button');
        modalStore.clear();

	}
	function abortHandler() {
		console.log('Abort Button');
        modalStore.clear();
	}
</script>

<div class="container mx-small p-8 space-y-8 variant-filled-surface rounded w-auto">
	<h1 class="h1">Einstellungen</h1>

	<div class="space-y-1">
		<p>Simbrief</p>
		<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
			<div class="input-group-shim">Username: </div>
			<input type="text"
             />
		</div>
	</div>

	<div class="space-y-8 flex flex-col items-center">
		<div>
			<button type="button" class="btn variant-filled-success" on:click={confirmHandler}>Speichern</button>
			<button type="button" class="btn variant-filled-error" on:click={abortHandler}>Abbrechen</button>
		</div>
	</div>
</div>
