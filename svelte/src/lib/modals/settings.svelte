<script lang="js">
  import { getModalStore } from "@skeletonlabs/skeleton";
  import { settings } from "$lib/stores";

  export let parent; // Keep this as is to allow it to be passed as a prop
  $: parentValue = parent;

  const modalStore = getModalStore();

  function confirmHandler() {
    //save Simbrief Username
    console.log("Confirm Button");
    modalStore.clear();
  }
  function abortHandler() {
    console.log("Abort Button");
    modalStore.clear();
  }
</script>

<div class="container mx-small p-8 space-y-8 variant-filled-surface rounded w-auto">
  <h1 class="h1">Einstellungen</h1>

  <div class="space-y-1">
    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
      <div class="input-group-shim">Simbrief Username:</div>
      <input type="text" bind:value={$settings.simbriefUsername} />
    </div>

    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
      <div class="input-group-shim">Flight Sim PC Address:</div>
      <input type="text" bind:value={$settings.flightSimAddress} />
    </div>
  </div>

  <div class="space-y-8 flex flex-col items-center">
    <div>
      <button type="button" class="btn variant-filled-success" on:click={confirmHandler}>Speichern</button>
      <button type="button" class="btn variant-filled-error" on:click={abortHandler}>Abbrechen</button>
    </div>
  </div>
</div>
