<script lang="js">
  import { TabGroup, Tab } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";
  import { loadAtc, AtcType } from "./vatsimFreqFunctions";

  let tabSet = "All";

  let atcControllers;

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
      atcTypes: [AtcType.APPROACH],
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

  onMount(() => {
    const currentLatitude = 52.370569; // Example latitude
    const currentLongitude = 9.680992; // Example longitude
    const atisSource = "VATSIM"; // Example source

    loadAtc(currentLatitude, currentLongitude, atisSource)
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
    <p>{tabSet}</p>
    <p>{JSON.stringify(atcControllers)}</p>
  </svelte:fragment>
</TabGroup>

<div class="card p-4 m-4 flex justify-between items-start">
  <div>
    <h1 class="text-left">Station</h1>
    <p class="text-left">ATC Type</p>
    <p class="text-left">Frequency</p>
  </div>

  <button type="button" class="btn variant-filled">Set</button>
</div>
