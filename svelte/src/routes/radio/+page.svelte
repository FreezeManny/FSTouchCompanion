<script lang="js">
  import { AppBar } from "@skeletonlabs/skeleton";
  import { onMount, onDestroy } from "svelte";
  import { getModalStore } from "@skeletonlabs/skeleton";

  import { settings } from "$lib/stores";

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

  let COM1_ACT_FREQ = "---.---";
  let COM1_STBY_FREQ = "---.---";
  let COM2_ACT_FREQ = "---.---";
  let COM2_STBY_FREQ = "---.---";

  let COM1_ACT_ID, COM1_STBY_ID;
  let COM2_ACT_ID, COM2_STBY_ID;

  const wsAddress = "ws://localhost:8086/api/v1";
  let ws;
  const RECONNECT_INTERVAL = 5000; // 5 seconds
  let req_id = 1;

  onMount(async () => {
    // Datarefs from aircraftData.json
    const COM1_DataRefs = {
      standby: "sim/cockpit2/radios/actuators/com1_standby_frequency_hz_833",
      active: "sim/cockpit2/radios/actuators/com1_frequency_hz_833",
    };
    const COM2_DataRefs = {
      standby: "sim/cockpit2/radios/actuators/com2_standby_frequency_hz_833",
      active: "sim/cockpit2/radios/actuators/com2_frequency_hz_833",
    };

    // Get dataref IDs for COM1
    COM1_ACT_ID = await getDatarefID(COM1_DataRefs.active);
    COM1_STBY_ID = await getDatarefID(COM1_DataRefs.standby);

    // Get dataref IDs for COM2
    COM2_ACT_ID = await getDatarefID(COM2_DataRefs.active);
    COM2_STBY_ID = await getDatarefID(COM2_DataRefs.standby);

    // Log the dataref IDs
    console.log("COM1 Active DataRef ID:", COM1_ACT_ID);
    console.log("COM1 Standby DataRef ID:", COM1_STBY_ID);
    console.log("COM2 Active DataRef ID:", COM2_ACT_ID);
    console.log("COM2 Standby DataRef ID:", COM2_STBY_ID);

    // Initialize WebSocket connection
    webSocketFunction();
  });

  async function getDatarefID(datarefName) {
    const url = `http://localhost:8086/api/v1/datarefs?filter[name]=${encodeURIComponent(datarefName)}`;
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
        const message = JSON.parse(event.data);
        if (message.type === "dataref_update_values") {
          handleDataRefUpdates(message.data);
        } else if (message.type === "result") {
          console.log("Result message:", message);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
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

  function handleDataRefUpdates(data) {
    console.log("DataRef updates:", data);
    if (data[COM1_ACT_ID]) {
      COM1_ACT_FREQ = formatFrequency(data[COM1_ACT_ID]);
      console.log("COM1 Active Frequency:", COM1_ACT_FREQ);
    }
    if (data[COM1_STBY_ID]) {
      COM1_STBY_FREQ = formatFrequency(data[COM1_STBY_ID]);
      console.log("COM1 Standby Frequency:", COM1_STBY_FREQ);
    }
    if (data[COM2_ACT_ID]) {
      COM2_ACT_FREQ = formatFrequency(data[COM2_ACT_ID]);
      console.log("COM2 Active Frequency:", COM2_ACT_FREQ);
    }
    if (data[COM2_STBY_ID]) {
      COM2_STBY_FREQ = formatFrequency(data[COM2_STBY_ID]);
      console.log("COM2 Standby Frequency:", COM2_STBY_FREQ);
    }

  }

  function formatFrequency(freqHz) {
    console.log("Frequency Hz:", freqHz);
    return freqHz;
    /*
    const freq = (freqHz / 1e6).toFixed(3);
    return freq.padStart(7, "0");
    */
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
          {COM1_ACT_FREQ}
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
          {COM1_STBY_FREQ}
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
          {COM2_ACT_FREQ}
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
          {COM2_STBY_FREQ}
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
