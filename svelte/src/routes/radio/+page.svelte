<script lang="js">
  import { AppBar } from "@skeletonlabs/skeleton";
  import { onMount, onDestroy } from "svelte";
  import { getModalStore } from "@skeletonlabs/skeleton";

  import { settings } from "$lib/stores";
  import aircraftData from "./aircraftData.json";

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
  const httpPort = "8081";
  const wsAddress = `ws://${$settings.flightSimAddress}:${wsPort}`;
  const httpAddress = `http://${$settings.flightSimAddress}:${httpPort}/api/v1`;

  let ws;
  const RECONNECT_INTERVAL = 5000; // 5 seconds
  let req_id = 1;

  onMount(async () => {
    await getAircraftName();

    const aircraft = aircraftData.find((a) => a.name.includes(AIRCRAFT_NAME)) || aircraftData[0];
    aircraftFound = !!aircraft;

    if (!aircraftFound) {
      console.error("Aircraft not found in Config");
      return;
    } else {
      const COM1_DataRefs = aircraft.data.com1.dataRef;
      const COM2_DataRefs = aircraft.data.com2.dataRef;

      // Get dataref IDs for COM1
      COM1_ACT_ID = await getDatarefID(COM1_DataRefs.active);
      COM1_STBY_ID = await getDatarefID(COM1_DataRefs.standby);

      //// Get dataref IDs for COM2
      COM2_ACT_ID = await getDatarefID(COM2_DataRefs.active);
      COM2_STBY_ID = await getDatarefID(COM2_DataRefs.standby);

      if (COM1_ACT_ID || COM1_STBY_ID || COM2_ACT_ID || COM2_STBY_ID) {
        // Initialize WebSocket connection if all IDss loaded
        webSocketFunction();
      }
    }
  });

  async function getAircraftName() {
    // Datarefs from aircraftData.json
    AIRCRAFT_NAME_ID = await getDatarefID("sim/aircraft/view/acf_ui_name");
    AIRCRAFT_NAME = await getSingleDataRef(AIRCRAFT_NAME_ID);
    console.log("Aircraft Name:", AIRCRAFT_NAME);
  }

  function loadRadioID() {}

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

  function webSocketFunction() {
    ws = new WebSocket(wsAddress);
    console.log("WebSocket connecting to:", wsAddress);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      isWebSocketOpen = true;
      subscribeDataRefs();
    };

    ws.onmessage = (event) => {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const message = JSON.parse(reader.result);
            console.log("Received message:", message);

            // Your existing code to handle the message

            if (message.hasOwnProperty("data")) {
              let data = message.data;

              if (message.type === "dataref_update_values") {
                console.log("DataRef updates:", data);
                if (data[COM1_ACT_ID]) {
                  COM1_ACT_FREQ = data[COM1_ACT_ID];
                  console.log("COM1 Active Frequency:", COM1_ACT_FREQ);
                }
                if (data[COM1_STBY_ID]) {
                  COM1_STBY_FREQ = data[COM1_STBY_ID];
                  console.log("COM1 Standby Frequency:", COM1_STBY_FREQ);
                }
                if (data[COM2_ACT_ID]) {
                  COM2_ACT_FREQ = data[COM2_ACT_ID];
                  console.log("COM2 Active Frequency:", COM2_ACT_FREQ);
                }
                if (data[COM2_STBY_ID]) {
                  COM2_STBY_FREQ = data[COM2_STBY_ID];
                  console.log("COM2 Standby Frequency:", COM2_STBY_FREQ);
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
      console.log("WebSocket connection closed. Reconnecting in", RECONNECT_INTERVAL, "ms");
      isWebSocketOpen = false;
      setTimeout(webSocketFunction, RECONNECT_INTERVAL);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  async function subscribeDataRefs() {
    const datarefs = [{ id: COM1_ACT_ID }, { id: COM1_STBY_ID }, { id: COM2_ACT_ID }, { id: COM2_STBY_ID }];
    const message = {
      req_id: req_id++,
      type: "dataref_subscribe_values",
      params: { datarefs },
    };
    console.log("Subscribing to datarefs:", datarefs);
    ws.send(JSON.stringify(message));
  }

  async function getSingleDataRef(id) {
    const url = `${httpAddress}/datarefs/${id}/value`;
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch dataref ID");
      }
      const result = await response.json();
      if (result.data && result.data.length > 0) {
        return processData(result.data);
      } else {
        throw new Error(`Dataref ${datarefName} not found`);
      }
    } catch (error) {
      console.error("Error fetching dataref ID:", error);
    }
  }

  function processData(data) {
    if (Array.isArray(data)) {
      return data.map((item) => {
        if (typeof item === "string" && isBase64(item)) {
          return atob(item).replace(/\0/g, "");
        } else if (typeof item === "number") {
          return item;
        } else {
          throw new Error(`Unexpected data type: ${typeof item}`);
        }
      });
    } else if (typeof data === "string" && isBase64(data)) {
      return atob(data).replace(/\0/g, "");
    } else if (typeof data === "number") {
      return data;
    } else {
      throw new Error(`Unexpected data type: ${typeof data}`);
    }
  }

  function isBase64(str) {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }

  function formatFrequency(freqHz) {
    console.log("Frequency Hz:", freqHz);
    const freqStr = freqHz.toString();
    const middleIndex = Math.floor(freqStr.length / 2);
    const formattedFreq = freqStr.slice(0, middleIndex) + "." + freqStr.slice(middleIndex);
    return formattedFreq;
  }

  function setDataRefValue(datarefId, value) {
    const message = {
      req_id: req_id++,
      type: "dataref_set_values",
      params: {
        datarefs: [{ id: datarefId, value }],
      },
    };
    ws.send(JSON.stringify(message));
  }

  function setMultipleDataRefValues(datarefs) {
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
    setMultipleDataRefValues([
      { id: COM1_ACT_ID, value: tmpStby },
      { id: COM1_STBY_ID, value: tmpAct },
    ]);
  }

  function com2SwitchButton() {
    let tmpAct = COM2_ACT_FREQ;
    let tmpStby = COM2_STBY_FREQ;
    setMultipleDataRefValues([
      { id: COM2_ACT_ID, value: tmpStby },
      { id: COM2_STBY_ID, value: tmpAct },
    ]);
  }

  onDestroy(() => {
    if (ws) {
      ws.close();
    }
  });
</script>

{#if isWebSocketOpen && aircraftFound}
  <hr class="!border-t-8" />
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
