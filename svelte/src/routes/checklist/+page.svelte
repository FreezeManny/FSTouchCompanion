<script lang="js">
  import { onMount } from "svelte";
  import checklistData from "./checklistData.json";
  import { checklistState } from "$lib/stores.js";

  const aircraftNames = Object.keys(checklistData);

  $: sections = $checklistState.aircraft
    ? Object.keys(checklistData[$checklistState.aircraft])
    : [];

  $: checklistItems =
    $checklistState.aircraft && $checklistState.section
      ? checklistData[$checklistState.aircraft][$checklistState.section]
      : [];

  let checkboxes = [];

  function resetCheckboxes() {
    checkboxes.forEach((checkbox) => (checkbox.checked = false));
  }

  function checkNext() {
    const nextCheckbox = checkboxes.find((checkbox) => !checkbox.checked);
    console.log(nextCheckbox);
    if (nextCheckbox) {
      nextCheckbox.checked = true;
    }
  }

  function nextSection(){

  }

  onMount(() => {
    // Update the checkboxes array after the component is mounted
    checkboxes = Array.from(
      document.querySelectorAll("input[type='checkbox']"),
    );
  });

  $: {
    // Update the checkboxes array whenever checklistItems change
    checkboxes = [];
  }
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

  <button type="button" class="btn variant-filled" on:click={resetCheckboxes}
    >Reset</button
  >
</div>

<!-- Content -->
<div class="p-4">
  {#if checklistItems.length > 0}
    {#each checklistItems as item, index}
      <div>
        {#each Object.entries(item) as [key, value]}
          <label>
            <input type="checkbox" bind:this={checkboxes[index]} />
            <strong>{key}:</strong>
            {value}
          </label><br />
        {/each}
      </div>
      {#if index < checklistItems.length - 1}
        <hr class="my-4" />
      {/if}
    {/each}
  {:else}
    <p>Select an aircraft and section to view the checklist.</p>
  {/if}
</div>

<!-- Bottom Bar -->
<div class="p-4 w-full">
  {#if true}
    <button type="button" class="btn variant-filled w-full" on:click={checkNext}
      >Check</button
    >
  {:else}
    <button type="button" class="btn variant-filled w-full" on:click={nextSection}
      >Next Checklist</button
    >
  {/if}
</div>
