<script lang="ts">
  import { selectedAirports, simbriefData } from "$lib/stores";
  import { RefreshCcw } from "@lucide/svelte";
  import { toaster } from "$lib/toaster";

  type SimbriefError = {
    message: string;
    timeout: number;
    hoverable: boolean;
    background: string;
  };
  const simbriefError = (message: string): SimbriefError => ({
    message: message,
    timeout: 5000,
    hoverable: true,
    background: "preset-filled-error-500",
  });

  // VATSIM URLs
  const VATSIMDATAURL = "https://data.vatsim.net/v3/vatsim-data.json";
  const VATSIM_METAR_URL = "https://metar.vatsim.net/";

  // Fetch modes
  const fetchMode = {
    DEP: "DEP",
    ARR: "ARR",
  } as const;
  type FetchMode = typeof fetchMode[keyof typeof fetchMode];

  // Airport data stores
  type AirportData = {
    atisCode: string | null;
    atisText: string;
    metar: string;
  };
  let dep: AirportData = $state({ atisCode: "", atisText: "", metar: "" });
  let arr: AirportData = $state({ atisCode: "", atisText: "", metar: "" });

  // Fetch airport data (ATIS and METAR)
  async function fetchAirportData(mode: FetchMode) {
    const airport = mode === fetchMode.DEP ? $selectedAirports.dep : $selectedAirports.arr;
    const upperAirport = airport.toUpperCase();

    await Promise.all([fetchATIS(mode, upperAirport), fetchMETAR(mode, upperAirport)]);
  }

  // Fetch METAR data
  async function fetchMETAR(mode: FetchMode, airport: string) {
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
  function setDefaultMetar(mode: FetchMode) {
    if (mode === fetchMode.DEP) dep.metar = "METAR not available for this airport";
    else arr.metar = "METAR not available for this airport";
  }

  // Fetch ATIS data
  async function fetchATIS(mode: FetchMode, airport: string) {
    try {
      const response = await fetch(VATSIMDATAURL);
      const data = await response.json();
      const atisList = data.atis.filter((element: any) => element.callsign.includes(airport));

      if (atisList.length) {
        let atisCodeList = atisList.map((item: any) => item.atis_code);
        const atisCode = atisCodeList.every((code: any) => code === atisCodeList[0]) ? atisCodeList[0] : null;
        const atisTexts = atisList.map((item: any) => item.text_atis).join("<br><br>");

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
  function setDefaultATIS(mode: FetchMode) {
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
    } else {
      setDefaultATIS(fetchMode.DEP);
      setDefaultMetar(fetchMode.DEP);
    }
  }
  
  // Handle airport input changes
  function updateArrival() {
    $selectedAirports.arr = $selectedAirports.arr.toUpperCase();
    if ($selectedAirports.arr.length === 4) {
      fetchAirportData(fetchMode.ARR);
    } else {
      setDefaultATIS(fetchMode.ARR);
      setDefaultMetar(fetchMode.ARR);
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
      const err = simbriefError("Simbrief Flightplan not Loaded");
      toaster.warning({
        title: err.message,
        description: "",
        meta: {
          timeout: err.timeout,
          hoverable: err.hoverable,
          background: err.background,
        },
      });
    }
  }

  function updateButtonHandler() {
    fetchAirportData(fetchMode.DEP);
    fetchAirportData(fetchMode.ARR);
  }

  // Load initial data when component mounts
  $effect(() => {
    if ($selectedAirports.dep.length === 4) fetchAirportData(fetchMode.DEP);
    if ($selectedAirports.arr.length === 4) fetchAirportData(fetchMode.ARR);
  });
</script>

<div class="h-full flex flex-col overflow-hidden">
  <div class="flex-none">
    <div class="grid grid-cols-3 p-2">
      <div class="mx-3">
        <div class="input-group grid-cols-[auto_1fr]">
          <div class="ig-cell preset-tonal">Dep</div>
          <input
            class="ig-input border border-neutral-700"
            type="text"
            placeholder="EDDS"
            bind:value={$selectedAirports.dep}
            oninput={updateDeparture}
            maxlength="4"
          />
        </div>
      </div>
      <div class="mx-3">
        <div class="input-group grid-cols-[auto_1fr]">
          <div class="ig-cell preset-tonal">Arr</div>
          <input
            class="ig-input border border-neutral-700"
            type="text"
            placeholder="EDDS"
            bind:value={$selectedAirports.arr}
            oninput={updateArrival}
            maxlength="4"
          />
        </div>
      </div>
      <div class="grid grid-cols-2">
        <button type="button" class="btn preset-filled mx-1" onclick={simbriefButtonHandler}>Simbrief</button>
        <button type="button" class="btn preset-filled mx-1" onclick={updateButtonHandler} aria-label="Update Weather">
          <RefreshCcw />
        </button>
      </div>
    </div>
  </div>

  <div class="flex-auto overflow-y-auto">
    <div class="flex flex-col p-2">
  <div class="card my-2 preset-filled-surface-100-900">
    <header class="card-header p-3">
      <span class="ml-1">Departure Airport: {$selectedAirports.dep.length === 4 ? $selectedAirports.dep : "Enter a valid ICAO"}</span>
    </header>
    <section class="p-2">
      <div class="card mb-2 border border-neutral-700 p-2">
        <header class="card-header mb-1">
          <span class="ml-1">ATIS</span>
          {#if dep.atisCode}
            <span class="ml-1">Code: {dep.atisCode}</span>
          {/if}
        </header>
        <section class="p-2 ml-1">{@html dep.atisText}</section>
      </div>
      <div class="card border border-neutral-700 p-2 mb-1">
        <header class="card-header mb-1"><span class="ml-1">METAR</span></header>
        <section class="p-2 ml-1">{dep.metar}</section>
      </div>
    </section>
  </div>
  <div class="card my-2 preset-filled-surface-100-900">
    <header class="card-header p-3">
      <span class="ml-1">Arrival Airport: {$selectedAirports.arr.length === 4 ? $selectedAirports.arr : "Enter a valid ICAO"}</span>
    </header>
    <section class="p-2">
      <div class="card mb-2 border border-neutral-700 p-2">
        <header class="card-header mb-1">
          <span class="ml-1">ATIS</span>
          {#if arr.atisCode}
            <span class="ml-1">Code: {arr.atisCode}</span>
          {/if}
        </header>
        <section class="p-2 ml-1">{@html arr.atisText}</section>
      </div>
      <div class="card border border-neutral-700 p-2 mb-1">
        <header class="card-header mb-1"><span class="ml-1">METAR</span></header>
        <section class="p-2 ml-1">{arr.metar}</section>
      </div>
    </section>
  </div>
    </div>
  </div>
</div>