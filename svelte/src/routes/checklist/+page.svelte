<script lang="js">
  import checklistData from "./checklistData.json";
  import { checklistState } from "$lib/stores.js";

  const aircraftNames = Object.keys(checklistData);

  $: sections = $checklistState.aircraft
    ? Object.keys(checklistData[$checklistState.aircraft])
    : [];

  $: checklistItems = $checklistState.aircraft && $checklistState.section
    ? checklistData[$checklistState.aircraft][$checklistState.section]
    : [];
</script>

<!-- Top Bar -->
<div class="flex space-x-2 p-4">
  <label class="label">
    <select class="select" bind:value={$checklistState.aircraft}>
      <option value="" disabled selected>Select Aircraft</option>
      {#each aircraftNames as name}
        <option value={name}>{name}</option>
      {/each}
    </select>
  </label>

  <label class="label">
    <select
      class="select"
      bind:value={$checklistState.section}
      disabled={!$checklistState.aircraft}
    >
      <option value="" disabled selected>Select Section</option>
      {#each sections as section}
        <option value={section}>{section}</option>
      {/each}
    </select>
  </label>

  <div class="flex-grow"></div>
  <!-- This will take up remaining space -->

  <button type="button" class="btn variant-filled">Reset</button>
</div>

<!-- Content -->
<div class="p-4">
  {#if checklistItems.length > 0}
    {#each checklistItems as item, index}
      <p>
        {#each Object.entries(item) as [key, value]}
          <strong>{key}:</strong> {value}<br>
        {/each}
      </p>
      {#if index < checklistItems.length - 1}
        <hr class="my-4">
      {/if}
    {/each}
  {:else}
    <p>Select an aircraft and section to view the checklist.</p>
  {/if}
</div>

<!-- Bottom Bar -->
<div class="p-4 w-full">
  {#if true}
    <button type="button" class="btn variant-filled w-full">Check</button>
  {:else}
    <button type="button" class="btn variant-filled-success w-full"
      >Next Section</button
    >
  {/if}
</div>