<script lang="js">
  import checklistData from "./checklistData.json";
  import { checklistState } from "$lib/stores.js"

  const aircraftNames = Object.keys(checklistData);

  $: sections = $checklistState.aircraft
    ? Object.keys(checklistData[$checklistState.aircraft])
    : [];
</script>

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

  <button type="button" class="btn variant-filled">Reset</button>
</div>

<div class="flex space-x-2 p-4">
  <button type="button" class="btn variant-filled">Check</button>
</div>
