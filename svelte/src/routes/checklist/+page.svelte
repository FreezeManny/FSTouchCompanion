<script lang="ts">
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';

  import { checklistState, simbriefData } from "$lib/stores";
  import type { ChecklistData } from "../../types/checklist";

  // Load and sort aircraft data
  const modules = import.meta.glob("./aircraft/*.json", { eager: true });
  const aircraftList = Object.values(modules)
    .map((m: any) => m.default || m)
    .sort((a, b) => a.info.name.localeCompare(b.info.name)) as ChecklistData[];

  // Watch for Simbrief data changes and update aircraft selection
  $effect(() => {
    if ($simbriefData && $simbriefData.params) {
      const currentSimbriefId = $simbriefData.params.time_generated;
      
      if ($checklistState.lastSimbriefId !== currentSimbriefId) {
        $checklistState.lastSimbriefId = currentSimbriefId;
        $checklistState.manualAircraftOverride = false;
        
        const simbriefICAO = $simbriefData.aircraft?.icaocode;
        if (simbriefICAO) {
          const match = aircraftList.find(a => a.info.codes && a.info.codes.includes(simbriefICAO));
          if (match) {
            $checklistState.aircraft = match.info.name;
          }
        }
      }
    }
  });

  let checkboxStates = $state<boolean[]>([]);

  // Derived Data
  let currentAircraft = $derived(aircraftList.find((a) => a.info.name === $checklistState.aircraft));
  let sectionNames = $derived(currentAircraft ? Object.keys(currentAircraft.checklist) : []);
  let rawItems = $derived((currentAircraft && $checklistState.section ? currentAircraft.checklist[$checklistState.section] : []) || []);

  // Normalize items to a consistent structure for easier rendering
  let items = $derived(rawItems.map((item) => {
    if ("break" in item) return { type: "break" as const };
    if (Array.isArray(item)) return { type: "item" as const, label: item[0], value: item[1] };
    return { type: "item" as const, label: item.key, value: item.value, subitems: item.subitems };
  }));

  let stateKey = $derived($checklistState.aircraft && $checklistState.section ? `${$checklistState.aircraft}|${$checklistState.section}` : null);

  // Guarded derived computations to avoid accessing items[i] when undefined
  let allSelected = $derived(items.length > 0 && items.every((item, i) => item.type === "break" || !!checkboxStates[i]));
  let nextItemIndex = $derived(checkboxStates.findIndex((checked, i) => !checked && items[i] && items[i].type !== "break"));

  // Restore / sync state when selection or items change
  $effect(() => {
    // Always make sure checkboxStates matches items length to prevent undefined indexing
    if (stateKey) {
      const saved = $checklistState.statesMap?.[stateKey];
      checkboxStates = saved?.length === items.length ? saved : new Array(items.length).fill(false);
    } else if (checkboxStates.length !== items.length) {
      checkboxStates = new Array(items.length).fill(false);
    }
  });

  function saveState() {
    if (stateKey) {
      $checklistState.statesMap = { ...($checklistState.statesMap || {}), [stateKey]: checkboxStates };
    }
  }

  function resetSection() {
    checkboxStates = new Array(items.length).fill(false);
    saveState();
  }

  function resetAircraft() {
    if (!$checklistState.aircraft) return;
    const prefix = `${$checklistState.aircraft}|`;
    const newStatesMap = { ...($checklistState.statesMap || {}) };
    
    let changed = false;
    for (const key in newStatesMap) {
      if (key.startsWith(prefix)) {
        delete newStatesMap[key];
        changed = true;
      }
    }
    
    if (changed) {
      $checklistState.statesMap = newStatesMap;
    }
  }

  function checkNext() {
    if (nextItemIndex !== -1) {
      checkboxStates[nextItemIndex] = true;
      saveState();
    }
  }

  function nextSection() {
    const idx = sectionNames.indexOf($checklistState.section);
    if (idx >= 0 && idx < sectionNames.length - 1) $checklistState.section = sectionNames[idx + 1];
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.code === 'Space' || e.code === 'Enter') && nextItemIndex !== -1) {
      e.preventDefault();
      checkNext();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="h-full flex flex-col overflow-hidden">
  <div class="flex-none">
    <div class="flex flex-wrap items-center p-2 gap-2">
      <div class="mx-1">
        <div class="field-group grid-cols-[auto_1fr]">
          <div class="label mx-0 preset-tonal">Aircraft</div>
          <select
            class="select border border-neutral-700 pr-9"
            bind:value={$checklistState.aircraft}
            onchange={() => $checklistState.manualAircraftOverride = true}
          >
            <option value="" disabled selected>Select Aircraft</option>
            {#each aircraftList as aircraft}
              <option value={aircraft.info.name}>{aircraft.info.name}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <div class="mx-1">
        <div class="field-group grid-cols-[auto_1fr]">
          <div class="label preset-tonal">Section</div>
          <select
            class="select border border-neutral-700 pr-9"
            bind:value={$checklistState.section}
            disabled={!$checklistState.aircraft}
          >
            <option value="" disabled selected>Select Section</option>
            {#each sectionNames as section}
              <option value={section}>{section}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="ml-auto flex items-center justify-end">
        <Popover>
          <Popover.Trigger class="btn preset-filled mx-1">Reset</Popover.Trigger>
          <Portal>
            <Popover.Positioner class="z-20!">
              <Popover.Content class="rounded-lg shadow-xl bg-neutral-900 border border-neutral-700 p-0 min-w-[0] w-fit">
                <div class="flex flex-col">
                  <Popover.CloseTrigger>
                    <button
                      type="button"
                      class="w-full text-left px-3 py-2 text-base text-white border-b border-neutral-700 hover:bg-neutral-800 transition"
                      style="border-radius: 8px 8px 0 0;"
                      onclick={resetSection}
                    >
                      Reset Section
                    </button>
                  </Popover.CloseTrigger>
                  <Popover.CloseTrigger>
                    <button
                      type="button"
                      class="w-full text-left px-3 py-2 text-base text-white border-t border-neutral-700 hover:bg-neutral-800 transition"
                      style="border-radius: 0 0 8px 8px;"
                      onclick={resetAircraft}
                    >
                      Reset Entire Aircraft
                    </button>
                  </Popover.CloseTrigger>
                </div>
                <Popover.Arrow style="--arrow-size: 10px; --arrow-background: #171923;">
                  <Popover.ArrowTip />
                </Popover.Arrow>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover>
      </div>
    </div>
  </div>

  <div class="flex-auto overflow-y-auto">
    <!-- Content -->
    <div class="p-4 pb-24">
      {#if items.length > 0}
        {#each items as item, index}
          {#if item.type === "break"}
            <hr class="my-4 opacity-50" />
          {:else}
            <label class="flex items-start space-x-3 p-2 hover:bg-surface-500/10 rounded-sm cursor-pointer {index === nextItemIndex ? 'ring-2 ring-primary-500' : ''}">
              <input class="checkbox mt-1" type="checkbox" bind:checked={checkboxStates[index]} onchange={saveState} />
              <div class="grow">
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
  </div>
</div>

<!-- Floating Bottom Button -->
<div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
  {#if !allSelected}
    <button type="button" class="btn preset-filled py-7 px-15 shadow-lg" onclick={checkNext}>Check</button>
  {:else if sectionNames.indexOf($checklistState.section) != sectionNames.length - 1}
    <button type="button" class="btn preset-filled-success-500 py-7 px-15 shadow-lg" onclick={nextSection}>Next Checklist</button>
  {:else}
    <button type="button" class="btn preset-filled-error-500 py-7 px-15 shadow-lg" onclick={resetAircraft}>Reset Entire Aircraft</button>
  {/if}
</div>