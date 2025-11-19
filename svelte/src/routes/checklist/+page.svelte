<script lang="ts">
  import { checklistState } from "$lib/stores";
  import type { ChecklistData } from "../../types/checklist";

  // Load and sort aircraft data
  const modules = import.meta.glob("./aircraft/*.json", { eager: true });
  const aircraftList = Object.values(modules)
    .map((m: any) => m.default || m)
    .sort((a, b) => a.info.name.localeCompare(b.info.name)) as ChecklistData[];

  let checkboxStates: boolean[] = [];

  // Derived Data
  $: currentAircraft = aircraftList.find((a) => a.info.name === $checklistState.aircraft);
  $: sectionNames = currentAircraft ? Object.keys(currentAircraft.checklist) : [];
  $: rawItems = currentAircraft && $checklistState.section ? currentAircraft.checklist[$checklistState.section] : [];

  // Normalize items to a consistent structure for easier rendering
  $: items = rawItems.map((item) => {
    if ("break" in item) return { type: "break" as const };
    if (Array.isArray(item)) return { type: "item" as const, label: item[0], value: item[1] };
    return { type: "item" as const, label: item.key, value: item.value, subitems: item.subitems };
  });

  $: stateKey = $checklistState.aircraft && $checklistState.section ? `${$checklistState.aircraft}|${$checklistState.section}` : null;
  $: allSelected = items.length > 0 && items.every((item, i) => item.type === "break" || checkboxStates[i]);

  // Restore state when selection changes
  $: if (stateKey) {
    const saved = $checklistState.statesMap?.[stateKey];
    checkboxStates = saved?.length === items.length ? saved : new Array(items.length).fill(false);
  }

  function saveState() {
    if (stateKey) {
      $checklistState.statesMap = { ...($checklistState.statesMap || {}), [stateKey]: checkboxStates };
    }
  }

  function reset() {
    checkboxStates = new Array(items.length).fill(false);
    saveState();
  }

  function checkNext() {
    const index = checkboxStates.findIndex((checked, i) => !checked && items[i].type !== "break");
    if (index !== -1) {
      checkboxStates[index] = true;
      saveState();
    }
  }

  function nextSection() {
    const idx = sectionNames.indexOf($checklistState.section);
    if (idx >= 0 && idx < sectionNames.length - 1) $checklistState.section = sectionNames[idx + 1];
  }
</script>

<!-- Top Bar -->
<div class="flex space-x-2 p-4">
  <label class="label">
    <select class="select" bind:value={$checklistState.aircraft}>
      <option value="" disabled selected>Select Aircraft</option>
      {#each aircraftList as aircraft}
        <option value={aircraft.info.name}>{aircraft.info.name}</option>
      {/each}
    </select>
  </label>

  <label class="label">
    <select class="select" bind:value={$checklistState.section} disabled={!$checklistState.aircraft}>
      <option value="" disabled selected>Select Section</option>
      {#each sectionNames as section}
        <option value={section}>{section}</option>
      {/each}
    </select>
  </label>

  <div class="flex-grow"></div>
  <button type="button" class="btn variant-filled" on:click={reset}>Reset</button>
</div>

<!-- Content -->
<div class="p-4">
  {#if items.length > 0}
    {#each items as item, index}
      {#if item.type === "break"}
        <hr class="my-4 opacity-50" />
      {:else}
        <label class="flex items-start space-x-3 p-2 hover:bg-surface-500/10 rounded cursor-pointer">
          <input class="checkbox mt-1" type="checkbox" bind:checked={checkboxStates[index]} on:change={saveState} />
          <div class="flex-grow">
            <div class="flex justify-between w-full">
              <span>{item.label}</span>
              {#if item.value}<span class="font-bold text-right">{item.value}</span>{/if}
            </div>
            {#if item.subitems}
              <div class="pl-4 mt-1 text-sm opacity-75 space-y-1">
                {#each item.subitems as sub}
                  <div class="flex justify-between"><span>- {sub[0]}</span><span>{sub[1]}</span></div>
                {/each}
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
    <button type="button" class="btn variant-filled w-full" on:click={checkNext}>Check</button>
  {:else if sectionNames.indexOf($checklistState.section) != sectionNames.length - 1}
    <button type="button" class="btn variant-filled-success w-full" on:click={nextSection}>Next Checklist</button>
  {/if}
</div>
