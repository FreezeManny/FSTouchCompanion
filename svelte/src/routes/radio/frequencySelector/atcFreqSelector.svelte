<script lang="js">
  import { TabGroup, Tab } from "@skeletonlabs/skeleton";
  import { onMount, afterUpdate } from "svelte";
  import { loadAtc, AtcType } from "./atcFreqFunctions";
  import { settings } from "$lib/stores";
  import { popup } from "@skeletonlabs/skeleton";

  const popupFeatured = {
    // Represents the type of event that opens/closed the popup
    event: "click",
    // Matches the data-popup value on your popup element
    target: "popupFeatured",
    // Defines which side of your trigger the popup will appear
    placement: "left",
  };

  let tabSet = "all";

  let atcControllers = [];

  const atcDisplay = {
    all: {
      name: "All",
      atcTypes: [
        AtcType.UNKNOWN,
        AtcType.DELIVERY,
        AtcType.GROUND,
        AtcType.TOWER,
        AtcType.DEPARTURE,
        AtcType.APPROACH,
        AtcType.RADAR,
        AtcType.ATIS,
      ],
    },
    atis: {
      name: "ATIS",
      atcTypes: [AtcType.ATIS],
    },
    delivery: {
      name: "Delivery",
      atcTypes: [AtcType.DELIVERY],
    },
    ground: {
      name: "Ground",
      atcTypes: [AtcType.GROUND],
    },
    ground: {
      name: "Tower",
      atcTypes: [AtcType.TOWER],
    },
    depArr: {
      name: "Departure/Arrival",
      atcTypes: [AtcType.DEPARTURE, AtcType.APPROACH],
    },
    center: {
      name: "Center",
      atcTypes: [AtcType.RADAR],
    },
  };

  export let long;
  export let lat;

  export let setCom1Callback;
  export let setCom2Callback;

  const loadControllers = () => {
    loadAtc(lat, long, $settings.atcPlatform)
      .then((controllers) => {
        atcControllers = controllers;
      })
      .catch((err) => {
        console.error("Error loading ATC data:", err);
      });
  };

  onMount(() => {
    loadControllers();
  });

  $: if (lat && long && $settings.atcPlatform) {
    loadControllers();
  }

  function formatFrequency(frequency) {
    return Number(frequency.replace(".", ""));
  }
</script>

<TabGroup justify="justify-center" class="pt-4">
  {#each Object.entries(atcDisplay) as [key, display]}
    <Tab bind:group={tabSet} name={key} value={key}>{display.name}</Tab>
  {/each}
  <!-- Tab Panels --->
  <svelte:fragment slot="panel">
    <div>
      {#if atcControllers.some( (controller) => atcDisplay[tabSet].atcTypes.includes(controller.type), )}
        {#each atcControllers as controller}
          {#if atcDisplay[tabSet].atcTypes.includes(controller.type)}
            <div class="card p-4 m-4 flex justify-between items-center">
              <div class="flex flex-col items-start">
                <h3 class="h3 text-left">{controller.callsign}</h3>
                <p class="text-left">
                  {Object.keys(AtcType).find(
                    (key) => AtcType[key] === controller.type,
                  )}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <h3 class="h3 text-right">{controller.frequency}</h3>

                <button
                  class="btn variant-filled"
                  use:popup={{
                    ...popupFeatured,
                    target: `popupFeatured-${controller.callsign}`,
                  }}>Set</button
                >

                <div
                  class="card p-4 shadow-xl"
                  data-popup={`popupFeatured-${controller.callsign}`}
                >
                  <button
                    type="button"
                    class="btn variant-filled"
                    on:click={() =>
                      setCom1Callback(formatFrequency(controller.frequency))}
                    >COM1</button
                  >
                  <button
                    type="button"
                    class="btn variant-filled"
                    on:click={() =>
                      setCom2Callback(formatFrequency(controller.frequency))}
                    >COM2</button
                  >
                </div>
              </div>
            </div>
          {/if}
        {/each}
      {:else}
        <div class="card p-4 m-4 flex justify-center items-center">
          <p>No Station in range</p>
        </div>
      {/if}
    </div>
  </svelte:fragment>
</TabGroup>
