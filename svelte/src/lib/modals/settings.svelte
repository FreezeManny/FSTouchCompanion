<script lang="js">
  import { getModalStore, LightSwitch } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";

  import { settings } from "$lib/stores";

  export let parent; // Keep this as is to allow it to be passed as a prop
  $: parentValue = parent;

  import { modeUserPrefers } from "@skeletonlabs/skeleton";


  // Reactively update the class based on the selected mode
  $: {
    if ($settings.appearance === "dark") {
      document.documentElement.classList.add("dark");
      modeUserPrefers.set(true);
    } else {
      document.documentElement.classList.remove("dark");
      modeUserPrefers.set(false);
    }
  }

  const modalStore = getModalStore();
</script>

<div class="container mx-small p-8 space-y-8 variant-filled-surface rounded w-auto">
  <h1 class="h1">Einstellungen</h1>

  <div class="space-y-1">
    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
      <div class="input-group-shim">Appearance:</div>
      <select class="select" bind:value={$settings.appearance}>
        <option value="light">Light Mode</option>
        <option value="dark">Dark Mode</option>
      </select>
    </div>

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
    <button type="button" class="btn variant-filled-tertiary" on:click={() => modalStore.clear()}>Close</button>
  </div>
</div>
