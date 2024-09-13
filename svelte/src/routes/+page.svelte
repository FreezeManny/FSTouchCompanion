<script lang="js">
  import { settings, simbriefData } from "$lib/stores";
  import { getToastStore } from "@skeletonlabs/skeleton";
  import { goto } from "$app/navigation";

  const toastStore = getToastStore();

  const simbriefError = (message) => ({
    message: message,
    timeout: 5000,
    hoverable: true,
    background: "variant-filled-error",
  });

  async function getFlightPlan() {
    console.log("Fetching flight plan...");
    const fetchURL = "https://www.simbrief.com/api/xml.fetcher.php?username=" + $settings.simbriefUsername + "&json=1";
    try {
      const response = await fetch(fetchURL);
      const data = await response.json();

      if (data.fetch.status == "Success") {
        $simbriefData = data;
      } else {
        $simbriefData = null;
        toastStore.trigger(simbriefError("Simbrief: " + data.fetch.status));
      }
    } catch (error) {}
  }
  let flightNumber = "";
  let departure = "";
  let arrival = "";
  let aircraft = "";
  let date = "";

  $: if ($simbriefData) {
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
</script>

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
    <div class="text-center text-2xl">{flightNumber}</div>

    <!-- Departure / Arrival Section -->
    <div class="flex items-center justify-between mb-4">
      <!-- Departure Info -->
      <div class="card p-4 variant-filled-tertiary">
        <div class="text-center">
          <div class="text-lg font-bold">{departure.code}</div>
          <div class="text-surface text-sm">{departure.name}</div>
        </div>
      </div>

      <!-- Arrival Info -->
      <div class="card p-4 variant-filled-tertiary">
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
    <aside class="alert variant-filled-warning m-5">
      <!-- Message -->
      <div class="alert-message">
        <h3 class="h3">Load a valid Flightplan</h3>
      </div>
    </aside>
  {/if}

  <!-- Action Buttons -->
  <div class="flex justify-around">
    <button class="btn variant-filled" on:click={getFlightPlan}>Load Flightplan</button>
    <button class="btn variant-filled" on:click={() => goto("/flightplan")}>View Flightplan</button>
  </div>
</div>
