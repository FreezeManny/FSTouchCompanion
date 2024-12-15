<script lang="js">
  import { AppBar } from "@skeletonlabs/skeleton";
  import { onMount, onDestroy } from "svelte";
  import { getModalStore } from "@skeletonlabs/skeleton";

  import { settings } from "$lib/stores";
  import aircraftData from "./aircraftData.json";

  import { formatFrequency, isBase64, processData } from "./utils";

  let aircraftFound = true;
  let isWebSocketOpen = false;

  const modalStore = getModalStore();
  const COM1_Modal = {
    type: "component",
    component: "radioModal",
    title: "COM1 Frequency-Pad",
    response: (r) => r !== undefined && setDataRefValue(COM1_STBY_ID, r),
  };
  const COM2_Modal = {
    type: "component",
    component: "radioModal",
    title: "COM2 Frequency-Pad",
    response: (r) => r !== undefined && setDataRefValue(COM2_STBY_ID, r),
  };

  let COM1_ACT_FREQ = "------";
  let COM1_STBY_FREQ = "------";
  let COM2_ACT_FREQ = "------";
  let COM2_STBY_FREQ = "------";
  let AIRCRAFT_NAME;

  let AIRCRAFT_NAME_ID;
  let COM1_ACT_ID, COM1_STBY_ID;
  let COM2_ACT_ID, COM2_STBY_ID;

  //const wsAddress = "ws://localhost:8086/api/v1";
  const wsPort = "8080";
  const httpPort = "8086";
  const wsAddress = `ws://${$settings.flightSimAddress}:${wsPort}`;
  const httpAddress = `http://${$settings.flightSimAddress}:${httpPort}/api/v1`;

  let ws;
  let req_id = 1;

  onMount(async () => {
    // Datarefs from aircraftData.json
    AIRCRAFT_NAME_ID = await getDatarefID("sim/aircraft/view/acf_ui_name");
    AIRCRAFT_NAME = await getDatarefValue(AIRCRAFT_NAME_ID);

    if (!AIRCRAFT_NAME) {
      console.error("Aircraft Name not found");
      return;
    }
    await updateAircraftData(true);
    await loadInitialData(); // Fetch initial values for frequencies
  });

  async function loadInitialData() {
    try {
      COM1_ACT_FREQ = (await getDatarefValue(COM1_ACT_ID)) || "------";
      COM1_STBY_FREQ = (await getDatarefValue(COM1_STBY_ID)) || "------";
      COM2_ACT_FREQ = (await getDatarefValue(COM2_ACT_ID)) || "------";
      COM2_STBY_FREQ = (await getDatarefValue(COM2_STBY_ID)) || "------";
    } catch (error) {
      console.error("Error loading initial frequency values:", error);
    }
  }

  // Function to update aircraft data when aircraft name changes
  async function updateAircraftData(initLoad = false) {
    let aircraft = loadAircraftData();

    console.log("Aircraft Config:", aircraft);
    aircraftFound = !!aircraft;

    if (!aircraftFound) {
      console.error("Aircraft not found in Config");
      return;
    } else {
      const COM1_DataRefs = aircraft.data.com1.dataRef;
      const COM2_DataRefs = aircraft.data.com2.dataRef;

      // Get new dataref IDs for COM frequencies
      await Promise.all([
        getDatarefID(COM1_DataRefs.active).then((id) => (COM1_ACT_ID = id)),
        getDatarefID(COM1_DataRefs.standby).then((id) => (COM1_STBY_ID = id)),
        getDatarefID(COM2_DataRefs.active).then((id) => (COM2_ACT_ID = id)),
        getDatarefID(COM2_DataRefs.standby).then((id) => (COM2_STBY_ID = id)),
      ]).then(() => {
        // Resubscribe to datarefs with new IDs
        if (!initLoad) {
          unsubscribeDataRefs(); // Unsubscribe from old datarefs
          subscribeDataRefs(); // Subscribe to new datarefs
        } else {
          webSocketFunction();
        }
      });
    }
  }

  function loadAircraftData() {
    const defaultAircraft = aircraftData.find((a) => a.name.includes("default"));
    const selectedAircraft = aircraftData.find((a) => a.name.includes(AIRCRAFT_NAME)) || defaultAircraft;

    const aircraft = {
      ...defaultAircraft,
      ...selectedAircraft,
      data: {
        ...defaultAircraft.data,
        ...selectedAircraft.data,
        com1: {
          ...defaultAircraft.data.com1,
          ...selectedAircraft.data.com1,
        },
        com2: {
          ...defaultAircraft.data.com2,
          ...selectedAircraft.data.com2,
        },
      },
    };
    return aircraft;
  }

  function unsubscribeDataRefs() {
    console.log("Unsubscribing from datarefs");
    if (ws) {
      // Unsubscribe from all datarefs
      const unsubscribeMessage = {
        req_id: req_id++,
        type: "dataref_unsubscribe_values",
        params: {
          datarefs: "all",
        },
      };
      ws.send(JSON.stringify(unsubscribeMessage));
    }
  }

  function webSocketFunction() {
    ws = new WebSocket(wsAddress);
    console.log("WebSocket connecting to:", wsAddress);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      isWebSocketOpen = true;
      subscribeDataRefs();
    };

    // Update the WebSocket message handler to process aircraft name and check for new COM data
    ws.onmessage = (event) => {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const message = JSON.parse(reader.result);

            if (message.hasOwnProperty("data")) {
              let data = message.data;
              if (message.type === "dataref_update_values") {
                if (data[COM1_ACT_ID]) {
                  COM1_ACT_FREQ = data[COM1_ACT_ID];
                }
                if (data[COM1_STBY_ID]) {
                  COM1_STBY_FREQ = data[COM1_STBY_ID];
                }
                if (data[COM2_ACT_ID]) {
                  COM2_ACT_FREQ = data[COM2_ACT_ID];
                }
                if (data[COM2_STBY_ID]) {
                  COM2_STBY_FREQ = data[COM2_STBY_ID];
                }
                if (data[AIRCRAFT_NAME_ID]) {
                  const newAircraftName = processData(data[AIRCRAFT_NAME_ID]);
                  if (AIRCRAFT_NAME !== newAircraftName) {
                    AIRCRAFT_NAME = newAircraftName;
                    console.log("Aircraft Name changed to:", AIRCRAFT_NAME);
                    updateAircraftData();
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
        reader.readAsText(event.data);
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      //console.log("WebSocket connection closed. Reconnecting in", RECONNECT_INTERVAL, "ms");
      isWebSocketOpen = false;
      //setTimeout(webSocketFunction, RECONNECT_INTERVAL);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  async function subscribeDataRefs() {
    const datarefs = [
      { id: COM1_ACT_ID },
      { id: COM1_STBY_ID },
      { id: COM2_ACT_ID },
      { id: COM2_STBY_ID },
      { id: AIRCRAFT_NAME_ID },
    ];
    const message = {
      req_id: req_id++,
      type: "dataref_subscribe_values",
      params: { datarefs },
    };
    console.log("Subscribing to datarefs:", datarefs);
    ws.send(JSON.stringify(message));
  }

  async function getDatarefID(datarefName) {
    const url = `${httpAddress}/datarefs?filter[name]=${datarefName}`;
    console.log("Fetching dataref ID:", url);
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch dataref ID");
      }
      const result = await response.json();
      if (result.data && result.data.length > 0) {
        return result.data[0].id;
      } else {
        throw new Error(`Dataref ${datarefName} not found`);
      }
    } catch (error) {
      console.error("Error fetching dataref ID:", error);
    }
  }

  async function getDatarefValue(id) {
    try {
      const url = `${httpAddress}/datarefs/${id}/value`;
      console.log("Fetching dataref value:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(`${result.error_message} (Code: ${result.error_code})`);
      }
      if (result.data !== undefined) {
        return processData(result.data);
      } else {
        throw new Error(`Dataref ${id} not found`);
      }
    } catch (error) {
      console.error("Error fetching dataref ID:", error);
    }
  }

  function setDataRefValue(datarefIdOrDatarefs, value) {
    let datarefs;
    if (Array.isArray(datarefIdOrDatarefs)) {
      datarefs = datarefIdOrDatarefs;
    } else {
      datarefs = [{ id: datarefIdOrDatarefs, value }];
    }
    const message = {
      req_id: req_id++,
      type: "dataref_set_values",
      params: {
        datarefs,
      },
    };
    ws.send(JSON.stringify(message));
  }

  function com1SwitchButton() {
    let tmpAct = COM1_ACT_FREQ;
    let tmpStby = COM1_STBY_FREQ;
    setDataRefValue([
      { id: COM1_ACT_ID, value: tmpStby },
      { id: COM1_STBY_ID, value: tmpAct },
    ]);
  }

  function com2SwitchButton() {
    let tmpAct = COM2_ACT_FREQ;
    let tmpStby = COM2_STBY_FREQ;
    setDataRefValue([
      { id: COM2_ACT_ID, value: tmpStby },
      { id: COM2_STBY_ID, value: tmpAct },
    ]);
  }

  onDestroy(() => {
    if (ws) {
      unsubscribeDataRefs();
      ws.close();
    }
  });
</script>

<hr class="!border-t-8" />
{#if isWebSocketOpen && aircraftFound}
  <AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
    <svelte:fragment slot="lead">
      <button type="button" id="btn_COM1" class="btn btn-lg variant-filled-primary px-2 font-bold"> COM1 </button>
    </svelte:fragment>

    <div class="flex justify-center">
      <span class="badge variant-filled p-4">
        <h1 class="h1">
          {formatFrequency(COM1_ACT_FREQ)}
        </h1>
      </span>

      <button type="button" class="btn btn-lg variant-filled-primary mx-1" on:click={com1SwitchButton}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>

      <span class="badge variant-filled p-4">
        <h1 class="h1">
          {formatFrequency(COM1_STBY_FREQ)}
        </h1>
      </span>
    </div>

    <svelte:fragment slot="trail">
      <button type="button" class="btn btn-lg variant-filled-primary" on:click={() => modalStore.trigger(COM1_Modal)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
          />
        </svg>
      </button>
    </svelte:fragment>
  </AppBar>

  <hr class="!border-t-8" />

  <AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
    <svelte:fragment slot="lead">
      <button type="button" id="btn_COM2" class="btn btn-lg variant-filled-primary px-2 font-bold"> COM2 </button>
    </svelte:fragment>

    <div class="flex justify-center">
      <span class="badge variant-filled p-4">
        <h1 class="h1">
          {formatFrequency(COM2_ACT_FREQ)}
        </h1>
      </span>

      <button type="button" class="btn btn-lg variant-filled-primary mx-1" on:click={com2SwitchButton}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>

      <span class="badge variant-filled p-4">
        <h1 class="h1">
          {formatFrequency(COM2_STBY_FREQ)}
        </h1>
      </span>
    </div>

    <svelte:fragment slot="trail">
      <button type="button" class="btn btn-lg variant-filled-primary" on:click={() => modalStore.trigger(COM2_Modal)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
          />
        </svg>
      </button>
    </svelte:fragment>
  </AppBar>
  <a class="block card card-hover m-4 p-4 text-lg">Selected Aircraft: {AIRCRAFT_NAME}</a>
{:else}
  <aside class="alert variant-filled-warning m-5">
    <!-- Message -->
    <div class="alert-message">
      <h3 class="h3">
        {#if !isWebSocketOpen}
          WebSocket connection failed
        {:else if !aircraftFound}
          Aircraft not found in Config
        {/if}
      </h3>
    </div>
  </aside>
{/if}
