<script>
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { selectedAirports, settings } from "$lib/stores";

  // VATSIM URLs
  const VATSIMDATAURL = "https://data.vatsim.net/v3/vatsim-data.json";
  const VATSIM_METAR_URL = "https://metar.vatsim.net/";

  // Fetch modes
  const fetchMode = {
    DEP: "DEP",
    ARR: "ARR",
  };

  // Airport data stores
  let dep = { atisCode: "", atisText: "", metar: "" };
  let arr = { atisCode: "", atisText: "", metar: "" };

  // Local storage for airport selections

  // Fetch Simbrief route data
  async function fetchSimbriefRoute() {
    const fetchURL = "https://www.simbrief.com/api/xml.fetcher.php?username=" + $settings.simbriefUsername + "&json=1";
    try {
      const response = await fetch(fetchURL);
      const data = await response.json();

      if (data.fetch.status == "Success") {
        $selectedAirports.dep = data.origin.icao_code;
        $selectedAirports.arr = data.destination.icao_code;
      } else {
        console.log("Simbrief: " + data.fetch.status);
      }
    } catch (error) {
      handleError(error);
    }
  }

  // Fetch airport data (ATIS and METAR)
  async function fetchAirportData(mode) {
    const airport = mode === fetchMode.DEP ? $selectedAirports.dep : $selectedAirports.arr;
    const upperAirport = airport.toUpperCase();

    await Promise.all([fetchATIS(mode, upperAirport), fetchMETAR(mode, upperAirport)]);
  }

  // Fetch METAR data
  async function fetchMETAR(mode, airport) {
    try {
      const response = await fetch(`${VATSIM_METAR_URL}${airport}`);
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.text();
      if (data) {
        if (mode === fetchMode.DEP) dep.metar = data;
        else arr.metar = data;
      } else {
        setDefaultMetar(mode);
      }
    } catch (error) {
      console.error("Error fetching METAR data:", error);
      setDefaultMetar(mode);
    }
  }

  // Set default METAR message
  function setDefaultMetar(mode) {
    if (mode === fetchMode.DEP) dep.metar = "METAR not available for this airport";
    else arr.metar = "METAR not available for this airport";
  }

  // Fetch ATIS data
  async function fetchATIS(mode, airport) {
    try {
      const response = await fetch(VATSIMDATAURL);
      const data = await response.json();
      const atisList = data.atis.filter((element) => element.callsign.includes(airport));

      if (atisList.length) {
        const { atis_code, text_atis } =
          atisList.length === 1
            ? atisList[0]
            : {
                atis_code: "",
                text_atis: atisList.map((item) => item.text_atis).join("<br><br>"),
              };

        if (mode === fetchMode.DEP) {
          dep.atisCode = atis_code;
          dep.atisText = text_atis;
        } else {
          arr.atisCode = atis_code;
          arr.atisText = text_atis;
        }
      } else {
        setDefaultATIS(mode);
      }
    } catch (error) {
      handleError(error);
    }
  }

  // Set default ATIS message
  function setDefaultATIS(mode) {
    if (mode === fetchMode.DEP) dep.atisText = "No ATIS Online";
    else arr.atisText = "No ATIS Online";
  }

  // Handle airport input changes
  function updateDeparture() {
    $selectedAirports.dep = $selectedAirports.dep.toUpperCase();
    if ($selectedAirports.dep.length === 4) {
      fetchAirportData(fetchMode.DEP);
    }
  }
  // Handle airport input changes
  function updateArrival() {
    $selectedAirports.arr = $selectedAirports.arr.toUpperCase();
    if ($selectedAirports.arr.length === 4) {
      fetchAirportData(fetchMode.ARR);
    }
  }

  // Button handler for Simbrief
  async function simbriefButtonHandler() {
    await fetchSimbriefRoute();
    fetchAirportData(fetchMode.DEP);
    fetchAirportData(fetchMode.ARR);
  }

  // Error handler
  function handleError(error) {
    console.error("Error fetching data:", error);
  }

  // Lifecycle methods
  onMount(() => {
    $selectedAirports.dep = get(selectedAirports).dep;
    $selectedAirports.arr = get(selectedAirports).arr;
    if ($selectedAirports.dep.length === 4) fetchAirportData(fetchMode.DEP);
    if ($selectedAirports.arr.length === 4) fetchAirportData(fetchMode.ARR);
  });
</script>

<div class="grid grid-cols-3 p-2">
  <div class="mx-3">
    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
      <div class="input-group-shim">Dep</div>
      <input
        type="text"
        placeholder="EDDS"
        bind:value={$selectedAirports.dep}
        on:input={updateDeparture}
        maxlength="4"
      />
    </div>
  </div>
  <div class="mx-3">
    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
      <div class="input-group-shim">Arr</div>
      <input type="text" placeholder="EDDS" bind:value={$selectedAirports.arr} on:input={updateArrival} maxlength="4" />
    </div>
  </div>
  <button type="button" class="btn variant-filled mx-3" on:click={simbriefButtonHandler}>Simbrief</button>
</div>

<div class="flex flex-col p-2">
  <div class="card my-1">
    <header class="card-header">
      Departure Airport: {$selectedAirports.dep.length === 4 ? $selectedAirports.dep : "Enter a valid ICAO"}
    </header>
    <section class="p-4">
      <div class="card mb-2">
        <header class="card-header">ATIS {dep.atisCode}</header>
        <section class="p-4">{@html dep.atisText}</section>
      </div>
      <div class="card">
        <header class="card-header">METAR</header>
        <section class="p-4">{dep.metar}</section>
      </div>
    </section>
  </div>
  <div class="card my-1">
    <header class="card-header">
      Arrival Airport: {$selectedAirports.arr.length === 4 ? $selectedAirports.arr : "Enter a valid ICAO"}
    </header>
    <section class="p-4">
      <div class="card mb-2">
        <header class="card-header">ATIS {arr.atisCode}</header>
        <section class="p-4">{arr.atisText}</section>
      </div>
      <div class="card">
        <header class="card-header">METAR</header>
        <section class="p-4">{arr.metar}</section>
      </div>
    </section>
  </div>
</div>
