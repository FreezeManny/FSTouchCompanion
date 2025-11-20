<script lang="ts">
  import { run } from 'svelte/legacy';
  import { createToaster } from "@skeletonlabs/skeleton-svelte";

  import { settings, simbriefData } from "$lib/stores";
  import { goto } from "$app/navigation";
  import { isWebSocketOpen, connectionError, fsData, retryConnectionCallback } from "$lib/websocket";

  type SimbriefData = {
    atc: { callsign: string };
    origin: { icao_code: string; name: string };
    destination: { icao_code: string; name: string };
    aircraft: { name: string };
    params: { time_generated: number };
    fetch: { status: string };
  };

  type DepartureArrival = { code: string; name: string };

  type SimbriefError = {
    message: string;
    timeout: number;
    hoverable: boolean;
    background: string;
  };

  const simbriefError = (message: string): SimbriefError => ({
    message,
    timeout: 5000,
    hoverable: true,
    background: "preset-filled-error-500",
  });

  // provide a tiny wrapper so existing toastStore.trigger(...) usage continues to work
  function getToastStore() {
    const toaster = createToaster({});
    return {
      trigger: (payload: SimbriefError) =>
        toaster.error({
          title: payload.message,
          description: "",
          // Move timeout into meta to avoid passing unknown properties to the toaster API
          meta: {
            timeout: payload.timeout,
            hoverable: payload.hoverable,
            background: payload.background,
          },
        }),
      info: (opts: any) => toaster.info(opts),
      success: (opts: any) => toaster.success(opts),
      warning: (opts: any) => toaster.warning(opts),
    };
  }

  const toastStore = getToastStore();

  async function getFlightPlan(): Promise<void> {
    console.log("Fetching flight plan...");
    const fetchURL =
      "https://www.simbrief.com/api/xml.fetcher.php?username=" + $settings.simbriefUsername + "&json=1";
    try {
      const response = await fetch(fetchURL);
      const data: SimbriefData = await response.json();

      if (data.fetch.status === "Success") {
        $simbriefData = data;
      } else {
        $simbriefData = null;
        toastStore.trigger(simbriefError("Simbrief: " + data.fetch.status));
      }
    } catch (error) {
      // Optionally handle error
    }
  }

  let flightNumber: string = $state("");
  let departure: DepartureArrival = $state({ code: "", name: "" });
  let arrival: DepartureArrival = $state({ code: "", name: "" });
  let aircraft: string = $state("");
  let date: string = $state("");

  run(() => {
    if ($simbriefData) {
      flightNumber = $simbriefData.atc.callsign;
      departure = { code: $simbriefData.origin.icao_code, name: $simbriefData.origin.name };
      arrival = { code: $simbriefData.destination.icao_code, name: $simbriefData.destination.name };
      aircraft = $simbriefData.aircraft.name;
      date = new Date($simbriefData.params.time_generated * 1000).toUTCString();
    } else {
      flightNumber = "XXXX";
      departure = { code: "", name: "XXXX" };
      arrival = { code: "XXXX", name: "XXXX" };
      aircraft = "XXXX";
      date = "XXXX";
    }
  });

  function handleRetryConnection() {
    if ($retryConnectionCallback) {
      $retryConnectionCallback();
    }
  }
</script>

<!-- WebSocket Connection Status -->
<div class="card p-4 max-w-md mx-auto mt-5">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="relative">
        {#if $isWebSocketOpen}
          {#if $fsData.Connected}
            <span class="badge preset-filled-success-500">●</span>
            <span class="ml-2">Flight Sim Connected</span>
          {:else}
            <span class="badge preset-filled-warning-500">●</span>
            <span class="ml-2">WebSocket Connected (Waiting for Flight Sim)</span>
          {/if}
        {:else}
          <span class="badge preset-filled-error-500">●</span>
          <span class="ml-2">Not Connected</span>
        {/if}
      </div>
    </div>
    {#if !$isWebSocketOpen}
      <button class="btn btn-sm preset-filled-primary-500" onclick={handleRetryConnection}>
        Retry
      </button>
    {/if}
  </div>
  {#if $connectionError && !$isWebSocketOpen}
    <div class="text-sm text-error-500 mt-2">
      {$connectionError}
    </div>
  {/if}
</div>

<div class="card p-6 max-w-md mx-auto my-5">
  {#if $simbriefData}
    <!-- Date -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div class="text-left text-surface text-sm mb-2">Latest Flight Plan:</div>
        <div class="text-right text-surface text-sm mb-2">{date}</div>
      </div>
    </div>

    <!-- Flight Number -->
    <div class="text-center text-2xl my-4">{flightNumber}</div>

    <!-- Departure / Arrival Section -->
    <div class="flex items-center justify-between mb-4">
      <!-- Departure Info -->
      <div class="card p-4 preset-filled-tertiary-500">
        <div class="text-center">
          <div class="text-lg font-bold">{departure.code}</div>
          <div class="text-surface text-sm">{departure.name}</div>
        </div>
      </div>

      <!-- Arrival Info -->
      <div class="card p-4 preset-filled-tertiary-500">
        <div class="text-center">
          <div class="text-lg font-bold">{arrival.code}</div>
          <div class="text-surface text-sm">{arrival.name}</div>
        </div>
      </div>
    </div>

    <!-- Aircraft Type -->
    <div class="flex flex-col items-center justify-center my-5">
      <div class="text-surface text-sm mb-1">Aircraft Type:</div>
      <div class="text-center text-lg">
        {aircraft}
      </div>
    </div>
  {:else}
    <aside class="alert preset-filled-warning-500 m-5">
      <!-- Message -->
      <div class="alert-message">
        <h3 class="h3">Load a valid Flightplan</h3>
      </div>
    </aside>
  {/if}

  <!-- Action Buttons -->
  <div class="flex justify-around">
    <button class="btn preset-filled" onclick={getFlightPlan}>Load Flightplan</button>
    <button class="btn preset-filled" onclick={() => goto("/flightplan")}>View Flightplan</button>
  </div>
</div>
