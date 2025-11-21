<script lang="ts">
  import { loadAtc, AtcType, type AtcData } from "./atcFreqFunctions";
  import { settings } from "$lib/stores";
  import { Tabs, Popover, Portal } from "@skeletonlabs/skeleton-svelte";

  let atcControllers: AtcData[] = $state([]);

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

<div class="flex flex-col p-2">
  <div class="card my-2 preset-filled-surface-100-900">
    <section class="p-2">
      <Tabs defaultValue="all">
        <Tabs.List>
          {#each Object.entries(atcDisplay) as [key, display]}
            <Tabs.Trigger value={key}>{display.name}</Tabs.Trigger>
          {/each}
          <Tabs.Indicator />
        </Tabs.List>
        
        {#each Object.entries(atcDisplay) as [key, display]}
          <Tabs.Content value={key}>
            {#if atcControllers.some( (controller) => Array.from(display.atcTypes).map(Number).includes(controller.type) )}
              {#each atcControllers as controller}
                {#if Array.from(display.atcTypes).map(Number).includes(controller.type)}
                  <div class="card border border-neutral-700 p-4 m-2 flex justify-between items-center">
                    <div class="flex flex-col items-start">
                      <h3 class="h3 text-left">{controller.callsign}</h3>
                      <p class="text-left">
                        {Object.entries(AtcType).find(
                          ([, value]) => value === controller.type
                        )?.[0]}
                      </p>
                    </div>
                    <div class="flex items-center gap-2">
                      <h3 class="h3 text-right">{controller.frequency}</h3>

                      <Popover positioning={{ placement: 'left' }}>
                        <Popover.Trigger class="btn preset-filled">Set</Popover.Trigger>
                        <Portal>
                          <Popover.Positioner>
                            <Popover.Content class="card border border-neutral-700 p-4 bg-surface-100-900 shadow-xl">
                              <div class="flex gap-2">
                                <button
                                  type="button"
                                  class="btn preset-filled"
                                  onclick={() => {
                                    setCom1Callback(formatFrequency(controller.frequency));
                                  }}
                                >COM1</button>
                                <button
                                  type="button"
                                  class="btn preset-filled"
                                  onclick={() => {
                                    setCom2Callback(formatFrequency(controller.frequency));
                                  }}
                                >COM2</button>
                              </div>
                              <Popover.Arrow style="--arrow-size: calc(var(--spacing) * 2); --arrow-background: var(--color-surface-100-900);">
                                <Popover.ArrowTip />
                              </Popover.Arrow>
                            </Popover.Content>
                          </Popover.Positioner>
                        </Portal>
                      </Popover>
                    </div>
                  </div>
                {/if}
              {/each}
            {:else}
              <div class="card border border-neutral-700 p-4 m-2 flex justify-center items-center">
                <p>No Station in range</p>
              </div>
            {/if}
          </Tabs.Content>
        {/each}
      </Tabs>
    </section>
  </div>
</div>
