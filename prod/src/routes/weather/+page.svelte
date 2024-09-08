<script>
  import { settings } from "$lib/settings.js";
  import { onMount, onDestroy } from "svelte";
  import { localStorageStore } from "@skeletonlabs/skeleton";
  import { get } from "svelte/store";

  // VATSIM URLs
  const VATSIMDATAURL = "https://data.vatsim.net/v3/vatsim-data.json";
  const VATSIM_METAR_URL = "https://metar.vatsim.net/";

  // Fetch modes
  const fetchMode = {
    DEP: "DEP",
    ARR: "ARR",
  };

  // Airport data stores
  let dep = { input: "", atisCode: "", atisText: "", metar: "" };
  let arr = { input: "", atisCode: "", atisText: "", metar: "" };

  // Local storage for airport selections
  const depAptSave = localStorageStore("depAptSave", "EDDS");
  const arrAptSave = localStorageStore("arrAptSave", "EDDS");

  // Fetch Simbrief route data
  async function fetchSimbriefRoute() {
    try {
      const response = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?username=${settings.simbriefUsername}&json=1`);
      const data = await response.json();
      dep.input = data.origin.icao_code;
      arr.input = data.destination.icao_code;
    } catch (error) {
      handleError(error);
    }
  }

  // Fetch airport data (ATIS and METAR)
  async function fetchAirportData(mode) {
    const airport = mode === fetchMode.DEP ? dep.input : arr.input;
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
  function updateAirportInput(airport) {
    airport.input = airport.input.toUpperCase();
    if (airport.input.length === 4) {
      if (airport === dep) {
        // Only fetch airport data for Departure if the input is exactly 4 characters
        fetchAirportData(fetchMode.DEP);
      } else {
        // For Arrival, always fetch airport data if it has 4 characters
        fetchAirportData(fetchMode.ARR);
      }
    }
  }

  // Button handler for Simbrief
  async function simbriefButtonHandler() {
    await fetchSimbriefRoute();
  }

  // Error handler
  function handleError(error) {
    console.error("Error fetching data:", error);
  }

  // Lifecycle methods
  onMount(() => {
    dep.input = get(depAptSave);
    arr.input = get(arrAptSave);
    if (dep.input.length === 4) fetchAirportData(fetchMode.DEP);
    if (arr.input.length === 4) fetchAirportData(fetchMode.ARR);
  });

  onDestroy(() => {
    depAptSave.set(dep.input);
    arrAptSave.set(arr.input);
    console.log("Component is being destroyed");
  });
</script>

<div class="grid grid-cols-3 p-2">
  <div class="mx-3">
    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
      <div class="input-group-shim">Dep</div>
      <input type="text" placeholder="EDDS" bind:value={dep.input} on:input={() => updateAirportInput(dep)} maxlength="4" />
    </div>
  </div>
  <div class="mx-3">
    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
      <div class="input-group-shim">Arr</div>
      <input type="text" placeholder="EDDS" bind:value={arr.input} on:input={() => updateAirportInput(arr)} maxlength="4" />
    </div>
  </div>
  <button type="button" class="btn variant-filled mx-3" on:click={simbriefButtonHandler}>Simbrief</button>
</div>

<div class="flex flex-col p-2">
  <div class="card my-1">
    <header class="card-header">Departure Airport: {dep.input.length === 4 ? dep.input : "Enter a valid ICAO"}</header>
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
    <header class="card-header">Arrival Airport: {arr.input.length === 4 ? arr.input : "Enter a valid ICAO"}</header>
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
