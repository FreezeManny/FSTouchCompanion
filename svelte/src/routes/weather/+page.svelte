<script>
  import { onMount, onDestroy } from "svelte";
  import { get } from "svelte/store";
  import { selectedAirports, settings, simbriefData } from "$lib/stores";
  import { getToastStore } from "@skeletonlabs/skeleton";
  const toastStore = getToastStore();

  const simbriefError = (message) => ({
    message: message,
    timeout: 5000,
    hoverable: true,
    background: "variant-filled-error",
  });

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
        console.log(atisList);

        let atisCodeList = atisList.map((item) => item.atis_code);
        const atisCode = atisCodeList.every((code) => code === atisCodeList[0]) ? atisCodeList : [];
        const atisTexts = atisList.map((item) => item.text_atis).join("<br><br>");

        if (mode === fetchMode.DEP) {
          dep.atisCode = atisCode;
          dep.atisText = atisTexts;
        } else {
          arr.atisCode = atisCode;
          arr.atisText = atisTexts;
        }
      } else {
        setDefaultATIS(mode);
      }
    } catch (error) {
      console.error("Error fetching ATIS data:", error);
      setDefaultATIS(mode);
    }
  }

  // Set default ATIS message
  function setDefaultATIS(mode) {
    if (mode === fetchMode.DEP) {
      dep.atisText = "No ATIS Online";
      dep.atisCode = null;
    } else {
      arr.atisText = "No ATIS Online";
      arr.atisCode = null;
    }
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
  function simbriefButtonHandler() {
    if ($simbriefData) {
      $selectedAirports.dep = $simbriefData.origin.icao_code;
      $selectedAirports.arr = $simbriefData.destination.icao_code;
      fetchAirportData(fetchMode.DEP);
      fetchAirportData(fetchMode.ARR);
    } else {
      toastStore.trigger(simbriefError("Simbrief Flightplan not Loaded"));
    }
  }

  function updateButtonHandler() {
    fetchAirportData(fetchMode.DEP);
    fetchAirportData(fetchMode.ARR);
  }

  // Lifecycle methods
  onMount(() => {
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
  <div class="grid grid-cols-2">
    <button type="button" class="btn variant-filled mx-1" on:click={simbriefButtonHandler}>Simbrief</button>
    <button type="button" class="btn variant-filled mx-1" on:click={updateButtonHandler}
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
    </button>
  </div>
</div>

<div class="flex flex-col p-2">
  <div class="card my-1">
    <header class="card-header">
      Departure Airport: {$selectedAirports.dep.length === 4 ? $selectedAirports.dep : "Enter a valid ICAO"}
    </header>
    <section class="p-4">
      <div class="card mb-2">
        <header class="card-header">
          ATIS
          {#if dep.atisCode}
            Code: {dep.atisCode}
          {/if}
        </header>
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
        <header class="card-header">
          ATIS
          {#if arr.atisCode}
            Code: {arr.atisCode}
          {/if}
        </header>
        <section class="p-4">{@html arr.atisText}</section>
      </div>
      <div class="card">
        <header class="card-header">METAR</header>
        <section class="p-4">{arr.metar}</section>
      </div>
    </section>
  </div>
</div>
