<script lang="js">
  import { run } from 'svelte/legacy';

  import { getModalStore, LightSwitch } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";

  import { settings } from "$lib/stores";


  import { modeUserPrefers } from "@skeletonlabs/skeleton";
  let { parent } = $props();



  const modalStore = getModalStore();
  let parentValue = $derived(parent);
  // Reactively update the class based on the selected mode
  run(() => {
    if ($settings.appearance === "dark") {
      document.documentElement.classList.add("dark");
      modeUserPrefers.set(true);
    } else {
      document.documentElement.classList.remove("dark");
      modeUserPrefers.set(false);
    }
  });
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

  <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
    <div class="input-group-shim">ATC-Platform:</div>
    <select class="select" bind:value={$settings.atcPlatform}>
      <option value="VATSIM">Vatsim</option>
      <option value="IVAO">Ivao</option>
    </select>
  </div>

  <div class="space-y-8 flex flex-col items-center">
    <button type="button" class="btn variant-filled-tertiary" onclick={() => modalStore.clear()}>Close</button>
  </div>

</div>
