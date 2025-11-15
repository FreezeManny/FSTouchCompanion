<script lang="js">
  import { onMount } from "svelte";
  import checklistData from "./checklistData.json";
  import { checklistState } from "$lib/stores.js";

  const aircraftNames = Object.keys(checklistData);

  let selectedAircraft = "";
  let selectedSection = "";
  let checkboxStates = [];

  // Generate a unique key for the current aircraft/section combination
  $: stateKey = selectedAircraft && selectedSection 
    ? `${selectedAircraft}|${selectedSection}` 
    : null;

  onMount(() => {
    // Restore last selected aircraft and section
    selectedAircraft = $checklistState.lastAircraft || "";
    selectedSection = $checklistState.lastSection || "";
  });

  $: sectionNames = selectedAircraft
    ? Object.keys(checklistData[selectedAircraft])
    : [];

  $: checklistItems =
    selectedAircraft && selectedSection
      ? checklistData[selectedAircraft][selectedSection]
      : [];

  // Initialize or restore checkbox states when checklist changes
  $: if (stateKey && checklistItems.length > 0) {
    const savedStates = $checklistState.states?.[stateKey];
    
    if (savedStates && savedStates.length === checklistItems.length) {
      // Restore saved state
      checkboxStates = savedStates;
    } else {
      // Initialize new state
      checkboxStates = checklistItems.map((item) =>
        Object.keys(item).map(() => false)
      );
      saveCheckboxStates();
    }
  }

  // Save state whenever aircraft or section changes
  $: if (selectedAircraft || selectedSection) {
    $checklistState.lastAircraft = selectedAircraft;
    $checklistState.lastSection = selectedSection;
  }

  // True if all checkboxes are selected
  $: allSelected = checkboxStates.length > 0 && checkboxStates.flat().every(Boolean);

  function saveCheckboxStates() {
    if (!stateKey) return;
    
    // Initialize states object if it doesn't exist
    if (!$checklistState.states) {
      $checklistState.states = {};
    }
    
    // Save current state for this aircraft/section combination
    $checklistState.states[stateKey] = checkboxStates;
  }

  function resetCheckboxes() {
    checkboxStates = checklistItems.map((item) =>
      Object.keys(item).map(() => false)
    );
    saveCheckboxStates();
  }

  function checkNext() {
    for (let i = 0; i < checkboxStates.length; i++) {
      for (let j = 0; j < checkboxStates[i].length; j++) {
        if (!checkboxStates[i][j]) {
          checkboxStates[i][j] = true;
          saveCheckboxStates();
          return;
        }
      }
    }
  }

  function nextSection() {
    const currentIndex = sectionNames.indexOf(selectedSection);
    if (currentIndex >= 0 && currentIndex < sectionNames.length - 1) {
      selectedSection = sectionNames[currentIndex + 1];
    }
  }
</script>

<!-- Top Bar -->
<div class="flex space-x-2 p-4">
  <label class="label">
    <select class="select" bind:value={selectedAircraft}>
      <option value="" disabled selected>Select Aircraft</option>
      {#each aircraftNames as name}
        <option value={name}>{name}</option>
      {/each}
    </select>
  </label>

  <label class="label">
    <select
      class="select"
      bind:value={selectedSection}
      disabled={!selectedAircraft}
    >
      <option value="" disabled selected>Select Section</option>
      {#each sectionNames as section}
        <option value={section}>{section}</option>
      {/each}
    </select>
  </label>

  <div class="flex-grow"></div>

  <button type="button" class="btn variant-filled" on:click={resetCheckboxes}
    >Reset</button
  >
</div>

<!-- Content -->
<div class="p-4">
  {#if checklistItems && checklistItems.length > 0}
    {#each checklistItems as item, index}
      <div>
        {#each Object.entries(item) as [key, value], subIndex}
          <label>
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={checkboxStates[index][subIndex]}
              on:change={saveCheckboxStates}
            />
            <strong>{key}:</strong>
            {value}
          </label>
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
  {#if !allSelected}
    <button type="button" class="btn variant-filled w-full" on:click={checkNext}
      >Check</button
    >
  {:else if sectionNames.indexOf(selectedSection) != sectionNames.length - 1}
    <button
      type="button"
      class="btn variant-filled-success w-full"
      on:click={nextSection}>Next Checklist</button
    >
  {/if}
</div>
