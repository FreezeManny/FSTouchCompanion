<script>
  export let flightNumber = "HLF5MF";
  export let departure = { code: "EDDS", city: "Stuttgart" };
  export let arrival = { code: "EDDF", city: "Frankfurt/Main" };
  export let aircraft = "B737-800";
  export let aircraftType = "ZIBO";
  export let date = "11 Sep 2024 - 18:49 UTC";
</script>

<!-- Card Container -->
<div class="card p-6 max-w-md mx-auto">
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
      <div class="text-surface text-sm">{departure.city}</div>
    </div>
    </div>

    <!-- Arrival Info -->
    <div class="card p-4 variant-filled-tertiary">
      <div class="text-center">
        <div class="text-lg font-bold">{arrival.code}</div>
        <div class="text-surface text-sm">{arrival.city}</div>
      </div>
    </div>
  </div>

  <!-- Aircraft Type -->
  <div class="text-center text-lg my-4">
    {aircraft}
  </div>

  <!-- Action Buttons -->
  <div class="flex justify-around">
    <button class="btn variant-filled">Load Flightplan</button>
    <button class="btn variant-filled">View Flightplan</button>
  </div>
</div>
