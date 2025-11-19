<script lang="ts">
  import { onMount } from 'svelte';
  import { checklistState } from '$lib/stores';
  import type { ChecklistItem, ChecklistData, ChecklistSection } from '../../types/checklist';

  // Import all aircraft JSON files
  const modules = import.meta.glob('./aircraft/*.json', { eager: true });
  const aircraftList: ChecklistData[] = Object.values(modules).map((m: any) => m.default || m);
  
  // Sort aircraft by name
  aircraftList.sort((a, b) => a.info.name.localeCompare(b.info.name));

  let selectedAircraftName: string = "";
  let selectedSection: string = "";
  let checkboxStates: boolean[] = [];

  // Get current aircraft data
  $: currentAircraft = aircraftList.find(a => a.info.name === selectedAircraftName);
  
  // Get available sections
  $: sectionNames = currentAircraft ? Object.keys(currentAircraft.checklist) : [];

  // Get current checklist items
  $: checklistItems = (currentAircraft && selectedSection)
    ? currentAircraft.checklist[selectedSection]
    : [];

  // Generate a unique key for the current aircraft/section combination
  $: stateKey = selectedAircraftName && selectedSection 
    ? `${selectedAircraftName}|${selectedSection}` 
    : null;

  onMount(() => {
    // Restore last selected aircraft and section
    if ($checklistState.aircraft && aircraftList.some(a => a.info.name === $checklistState.aircraft)) {
      selectedAircraftName = $checklistState.aircraft;
    }
    if ($checklistState.section) {
      selectedSection = $checklistState.section;
    }
  });

  // Initialize or restore checkbox states when checklist changes
  $: if (stateKey) {
    if (!$checklistState.statesMap) $checklistState.statesMap = {};
    const savedStates = $checklistState.statesMap[stateKey];
    
    // Create default states (all false)
    const defaultStates = checklistItems.map(() => false);

    // Restore if valid, otherwise reset
    if (savedStates && savedStates.length === defaultStates.length) {
      checkboxStates = savedStates;
    } else {
      checkboxStates = defaultStates;
    }
  }

  // Save state whenever aircraft or section changes
  $: if (selectedAircraftName || selectedSection) {
    $checklistState.aircraft = selectedAircraftName;
    $checklistState.section = selectedSection;
  }

  function isCheckable(item: ChecklistItem): boolean {
    return !('break' in item);
  }

  // True if all checkable items are selected
  $: allSelected = checklistItems.length > 0 && 
     checklistItems.every((item, i) => !isCheckable(item) || checkboxStates[i]);

  function saveCheckboxStates() {
    if (!$checklistState.statesMap) $checklistState.statesMap = {};
    if (stateKey) {
      $checklistState.statesMap[stateKey] = checkboxStates;
    }
  }

  function resetCheckboxes() {
    checkboxStates = checklistItems.map(() => false);
    saveCheckboxStates();
  }

  function checkNext() {
    // Find first unchecked item that is checkable
    const index = checkboxStates.findIndex((checked, i) => !checked && isCheckable(checklistItems[i]));
    if (index !== -1) {
      checkboxStates[index] = true;
      saveCheckboxStates();
    }
  }

  function nextSection() {
    const currentIndex = sectionNames.indexOf(selectedSection);
    if (currentIndex >= 0 && currentIndex < sectionNames.length - 1) {
      selectedSection = sectionNames[currentIndex + 1];
    }
  }

  // Type guards
  const isTuple = (item: ChecklistItem): item is [string, string] => Array.isArray(item);
  const isBreak = (item: ChecklistItem): item is { break: true } => 'break' in item;
  const isObject = (item: ChecklistItem): item is { key: string; value?: string; subitems?: [string, string][] } => !Array.isArray(item) && !('break' in item);
</script>

<!-- Top Bar -->
<div class="flex space-x-2 p-4">
  <label class="label">
    <select class="select" bind:value={selectedAircraftName}>
      <option value="" disabled selected>Select Aircraft</option>
      {#each aircraftList as aircraft}
        <option value={aircraft.info.name}>{aircraft.info.name}</option>
      {/each}
    </select>
  </label>

  <label class="label">
    <select
      class="select"
      bind:value={selectedSection}
      disabled={!selectedAircraftName}
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
      {#if isBreak(item)}
        <hr class="my-4 opacity-50" />
      {:else}
        <label class="flex items-start space-x-3 p-2 hover:bg-surface-500/10 rounded cursor-pointer">
          <input
            class="checkbox mt-1"
            type="checkbox"
            bind:checked={checkboxStates[index]}
            on:change={saveCheckboxStates}
          />
          <div class="flex-grow">
            {#if isTuple(item)}
              <div class="flex justify-between w-full">
                <span>{item[0]}</span>
                <span class="font-bold text-right">{item[1]}</span>
              </div>
            {:else if isObject(item)}
              <div class="flex flex-col w-full">
                <div class="flex justify-between w-full">
                  <span>{item.key}</span>
                  {#if item.value}
                    <span class="font-bold text-right">{item.value}</span>
                  {/if}
                </div>
                {#if item.subitems}
                  <div class="pl-4 mt-1 text-sm opacity-75 space-y-1">
                    {#each item.subitems as sub}
                      <div class="flex justify-between">
                        <span>- {sub[0]}</span>
                        <span>{sub[1]}</span>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </label>
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
