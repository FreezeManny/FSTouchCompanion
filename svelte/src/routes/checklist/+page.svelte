<script lang="js">
  import { onMount, onDestroy } from "svelte";
  import checklistData from "./checklistData.json";
  import { checklistState } from "$lib/stores.js";

  const aircraftNames = Object.keys(checklistData);

  let selectedAircraft = "";
  let selectedSection = "";

  onMount(() => {
    selectedAircraft = $checklistState.aircraft;
    selectedSection = $checklistState.section;
  });
  onDestroy(() => {
    $checklistState.aircraft = selectedAircraft;
    $checklistState.section = selectedSection;
  });

  $: sectionNames = selectedAircraft
    ? Object.keys(checklistData[selectedAircraft])
    : [];
  
    $: console.log(sectionNames);

  $: checklistItems =
    selectedAircraft && selectedSection
      ? checklistData[selectedAircraft][selectedSection]
      : [];

  let checkboxStates = [];
  let previousSection = selectedSection;

  $: if (checklistItems.length !== checkboxStates.length) {
    checkboxStates = checklistItems.map((item) =>
      Object.keys(item).map(() => false),
    );
    console.log("Checkbox states initialized:", checkboxStates);
  }

  $: if (selectedSection) {
    console.log("Reactive statement triggered");
    console.log(selectedSection);
  }

  // True if all checkboxes are selected
  $: allSelected = checkboxStates.flat().every(Boolean);

  function resetCheckboxes() {
    checkboxStates = checkboxStates.map((row) => row.map(() => false));
    console.log("Reset Checkboxes");
  }

  function checkNext() {
    console.log("check Next");
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
        {#each Object.entries(item) as [key, value], subIndex}
          <label>
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={checkboxStates[index][subIndex]}
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
  {:else}
    <button
      type="button"
      class="btn variant-filled-success w-full"
      on:click={nextSection}>Next Checklist</button
    >
  {/if}
</div>
