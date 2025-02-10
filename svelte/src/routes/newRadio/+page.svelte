<script lang="js">
  import { AppBar } from "@skeletonlabs/skeleton";
  import { onMount, onDestroy } from "svelte";

  import { settings } from "$lib/stores";
  import aircraftData from "./aircraftData.json";

  import { formatFrequency, isBase64, processData } from "./utils";
  import RadioDisplay from "./radio/RadioDisplay.svelte";

  import VatsimFreqSelector from "./frequencySelector/atcFreqSelector.svelte";

  let currentLatitude = 0; // Example latitude
  let currentLongitude = 0; // Example longitude

  let aircraftFound = true;
  let isWebSocketOpen = false;

  let COM1_ACT_FREQ = "------";
  let COM1_STBY_FREQ = "------";
  let COM2_ACT_FREQ = "------";
  let COM2_STBY_FREQ = "------";
  let AIRCRAFT_NAME;

  //const wsAddress = "ws://localhost:8086/api/v1";
  const wsPort = "8080";
  const wsAddress = `ws://${$settings.flightSimAddress}:${wsPort}/ws`;

  let ws;

  onMount(() => {
    webSocketFunction();
  });

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
            console.log("WebSocket message received:", reader.result);
            const message = JSON.parse(reader.result);
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
      console.log(
        "WebSocket connection closed. Reconnecting in",
        RECONNECT_INTERVAL,
        "ms",
      );
      isWebSocketOpen = false;
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  function com1Switch() {
    console.log("COM1 Switched");
    let tmp = {
      com1Switch: true,
    };
    ws.send(JSON.stringify(tmp));
  }

  function com2Switch() {
    console.log("COM2 Switched");
    let tmp = {
      com2Switch: true,
    };
    ws.send(JSON.stringify(tmp));
  }

  function com1Entry(frequency) {
    console.log("COM1 Frequency Changed to: " + frequency);
    let tmp = {
      com1Stby: frequency,
    };
    ws.send(JSON.stringify(tmp));
  }

  function com2Entry(frequency) {
    console.log("COM2 Frequency Changed to: " + frequency);
    let tmp = {
      com2Stby: frequency,
    };
    ws.send(JSON.stringify(tmp));
  }

  onDestroy(() => {
    if (ws) {
      unsubscribeDataRefs();
      ws.close();
    }
    if (LongLatIntervalID) {
      clearInterval(LongLatIntervalID);
    }
  });
</script>

{#if isWebSocketOpen && aircraftFound}
  <RadioDisplay
    {COM1_ACT_FREQ}
    {COM1_STBY_FREQ}
    {COM2_ACT_FREQ}
    {COM2_STBY_FREQ}
    com1SwitchCallback={com1Switch}
    com2SwitchCallback={com2Switch}
    com1EntryCallback={com1Entry}
    com2EntryCallback={com2Entry}
  />
  <!--
  <div class="block card card-hover m-4 p-4 text-lg">
    Selected Aircraft: {AIRCRAFT_NAME}
  </div>
  -->
  <hr class="!border-t-8" />

  <VatsimFreqSelector
    lat={currentLatitude}
    long={currentLongitude}
    setCom1Callback={com1Entry}
    setCom2Callback={com2Entry}
  />
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
