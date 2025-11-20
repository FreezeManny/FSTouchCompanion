<script lang="ts">
  import { loadAtc, AtcType, type AtcData } from "./atcFreqFunctions";
  import { settings } from "$lib/stores";

  let tabSet: keyof typeof atcDisplay = $state("all");

  let atcControllers: AtcData[] = $state([]);
  
  let openPopup: string | null = $state(null);

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
    tower: {
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

  let { long, lat, setCom1Callback, setCom2Callback }: {
    long: number;
    lat: number;
    setCom1Callback: (frequency: number) => void;
    setCom2Callback: (frequency: number) => void;
  } = $props();

  const loadControllers = () => {
    loadAtc(lat, long, $settings.atcPlatform)
      .then((controllers: AtcData[]) => {
        atcControllers = controllers;
      })
      .catch((err: unknown) => {
        console.error("Error loading ATC data:", err);
      });
  };

  // Use $effect to replace afterUpdate - reactively load controllers when dependencies change
  $effect(() => {
    if (lat && long && $settings.atcPlatform) {
      loadControllers();
    }
  });

  function formatFrequency(frequency: string): number {
    return Number(frequency.replace(".", ""));
  }
</script>

<div class="w-full">
  <!-- Tab Navigation -->
  <div class="flex justify-center pt-4 border-b border-surface-500/30">
    {#each Object.entries(atcDisplay) as [key, display]}
      <button
        type="button"
        class="px-4 py-2 transition-colors {tabSet === key ? 'border-b-2 border-primary-500 text-primary-500' : 'text-surface-600 hover:text-surface-900'}"
        onclick={() => tabSet = key as keyof typeof atcDisplay}
      >
        {display.name}
      </button>
    {/each}
  </div>
  
  <!-- Tab Panel -->
  <div>
      {#if atcControllers.some( (controller) => Array.from(atcDisplay[tabSet].atcTypes).map(Number).includes(controller.type) )}
        {#each atcControllers as controller}
          {#if Array.from(atcDisplay[tabSet].atcTypes).map(Number).includes(controller.type)}
            <div class="card p-4 m-4 flex justify-between items-center">
              <div class="flex flex-col items-start">
                <h3 class="h3 text-left">{controller.callsign}</h3>
                <p class="text-left">
                  {Object.entries(AtcType).find(
                    ([, value]) => value === controller.type
                  )?.[0]}
                </p>
              </div>
              <div class="flex items-center gap-2 relative">
                <h3 class="h3 text-right">{controller.frequency}</h3>

                <button
                  type="button"
                  class="btn preset-filled"
                  onclick={() => openPopup = openPopup === controller.callsign ? null : controller.callsign}
                >Set</button>

                {#if openPopup === controller.callsign}
                  <div class="card p-4 shadow-xl absolute right-0 top-full mt-2 z-10 flex flex-col gap-2">
                    <button
                      type="button"
                      class="btn preset-filled"
                      onclick={() => {
                        setCom1Callback(formatFrequency(controller.frequency));
                        openPopup = null;
                      }}
                    >COM1</button>
                    <button
                      type="button"
                      class="btn preset-filled"
                      onclick={() => {
                        setCom2Callback(formatFrequency(controller.frequency));
                        openPopup = null;
                      }}
                    >COM2</button>
                  </div>
                {/if}
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
</div>
