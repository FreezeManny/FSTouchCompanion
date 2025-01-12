<script lang="js">
  import { TabGroup, Tab } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";
  import { loadAtc, AtcType } from "./vatsimFreqFunctions";
  import { settings } from "$lib/stores";

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

  onMount(() => {
    loadAtc(lat, long, $settings.atcPlatform)
      .then((controllers) => {
        atcControllers = controllers;
        console.log("Filtered ATC controllers:", controllers);
      })
      .catch((err) => {
        console.error("Error loading ATC data:", err);
      });
  });
</script>

<TabGroup justify="justify-center">
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
                <button type="button" class="btn variant-filled">Set</button>
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
