<script lang="js">
  import { AppBar } from "@skeletonlabs/skeleton";
  import { onMount, onDestroy } from "svelte";
  import { getModalStore } from "@skeletonlabs/skeleton";
  import { settings } from "$lib/stores";

  let fsConnected = false;
  let aircraftFound = false;
  let isWebSocketOpen = false;

  const modalStore = getModalStore();
  const COM1_Modal = {
    type: "component",
    component: "radioModal",
    title: "COM1 Frequency-Pad",
    response: (r) => r !== undefined && sendDataRef("com1-stby", r),
  };
  const COM2_Modal = {
    type: "component",
    component: "radioModal",
    title: "COM2 Frequency-Pad",
    response: (r) => r !== undefined && sendDataRef("com2-stby", r),
  };

  let COM1_ACT_FREQ = "---.---";
  let COM1_STBY_FREQ = "---.---";
  let COM2_ACT_FREQ = "---.---";
  let COM2_STBY_FREQ = "---.---";

  let ws;
  const RECONNECT_INTERVAL = 5000; // 5 seconds

  // Initialize the WebSocket connection
  onMount(() => {
    webSocketFunction();
  });

  function webSocketFunction() {
    const WebSocketAddress = "ws://" + window.location.hostname + "/fsConnect";
    ws = new WebSocket(WebSocketAddress);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      isWebSocketOpen = true;
    };

    ws.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data);
        if (json.hasOwnProperty("fsConnected")) {
          fsConnected = json.fsConnected;
          console.log("fsConnected set to:", fsConnected);
        }
        if (json.hasOwnProperty("aircraftFound")) {
          console.log("aircraftFound set to:", aircraftFound);
          aircraftFound = json.aircraftFound;
          console.log("aircraftFound set to:", aircraftFound);
        }

        if (fsConnected) {
          const com1 = json.com1 || {};
          const com2 = json.com2 || {};

          COM1_ACT_FREQ = formatFrequency(com1.active);
          COM1_STBY_FREQ = formatFrequency(com1.standby);
          COM2_ACT_FREQ = formatFrequency(com2.active);
          COM2_STBY_FREQ = formatFrequency(com2.standby);
        } else {
          COM1_ACT_FREQ = "---.---";
          COM1_STBY_FREQ = "---.---";
          COM2_ACT_FREQ = "---.---";
          COM2_STBY_FREQ = "---.---";
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      isWebSocketOpen = false;
      // Attempt to reconnect
      setTimeout(webSocketFunction, RECONNECT_INTERVAL);
    };
  }

  function sendMessage(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
  }

  onDestroy(() => {
    if (ws) {
      ws.close();
    }
  });

  function formatFrequency(frequency) {
    if (frequency === undefined) return "---.---";
    // Convert frequency to string and pad with leading zeros if necessary
    let freqStr = frequency.toString().padStart(6, "0");
    // Insert the dot to format the frequency
    return `${freqStr.slice(0, 3)}.${freqStr.slice(3)}`;
  }

  function com1SwitchButton() {
    sendCommand("switch-com1");
  }
  function com2SwitchButton() {
    sendCommand("switch-com2");
  }

  function sendCommand(commandPrefix) {
    let data = {
      command: commandPrefix,
    };
    sendMessage(data);
  }

  function sendDataRef(dataRefPrefix, value) {
    let data = {
      dataRef: {
        dataRefPrefix: dataRefPrefix,
        value: value,
      },
    };
    sendMessage(data);
  }
</script>

{#if fsConnected && isWebSocketOpen && aircraftFound}
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
        {:else if !fsConnected}
          Flightsim not connected/paused
        {:else if !aircraftFound}
          Aircraft not found in Config
        {/if}
      </h3>
    </div>
  </aside>
{/if}
