<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { settings } from "$lib/stores";
  import RadioDisplay from "./radio/RadioDisplay.svelte";
  import VatsimFreqSelector from "./frequencySelector/atcFreqSelector.svelte";

  let isWebSocketOpen: boolean = false;

  interface Position {
    Lon: number;
    Lat: number;
  }

  interface FsDataType {
    Connected: boolean;
    Position: Position;
    Com1Stby: string;
    Com1Act: string;
    Com2Stby: string;
    Com2Act: string;
  }

  let FsData: FsDataType = {
    Connected: false,
    Position: { Lon: 0.0, Lat: 0.0 },
    Com1Stby: "------",
    Com1Act: "------",
    Com2Stby: "------",
    Com2Act: "------",
  };

  const wsPort = "8080";
  const wsAddress = `ws://${$settings.flightSimAddress}:${wsPort}/ws`;

  let ws: WebSocket;

  onMount(() => {
    webSocketFunction();
  });

  function webSocketFunction() {
    ws = new WebSocket(wsAddress);
    console.log("WebSocket connecting to:", wsAddress);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      isWebSocketOpen = true;
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        console.log("WebSocket message received:", event.data);
        const message = JSON.parse(event.data);

        if (message.Connected) {
          FsData.Connected = message.Connected || false;
        }
        if (message.Position) {
          FsData.Position = {
            ...FsData.Position,
            ...message.Position,
          };
        }
        if (message.Com1Stby) {
          FsData.Com1Stby = message.Com1Stby || "------";
        }
        if (message.Com1Act) {
          FsData.Com1Act = message.Com1Act || "------";
        }
        if (message.Com2Stby) {
          FsData.Com2Stby = message.Com2Stby || "------";
        }
        if (message.Com2Act) {
          FsData.Com2Act = message.Com2Act || "------";
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      isWebSocketOpen = false;
    };

    ws.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };
  }

  function com1Switch(): void {
    console.log("COM1 Switched");
    let tmp = {
      com1Switch: true,
    };
    ws.send(JSON.stringify(tmp));
  }

  function com2Switch(): void {
    console.log("COM2 Switched");
    let tmp = {
      com2Switch: true,
    };
    ws.send(JSON.stringify(tmp));
  }

  function com1Entry(frequency: string | number): void {
    console.log("COM1 Frequency Changed to: " + frequency);
    let tmp = {
      com1Stby: String(frequency),
    };
    ws.send(JSON.stringify(tmp));
  }

  function com2Entry(frequency: string | number): void {
    console.log("COM2 Frequency Changed to: " + frequency);
    let tmp = {
      com2Stby: String(frequency),
    };
    ws.send(JSON.stringify(tmp));
  }

  onDestroy(() => {
    if (ws) {
      ws.close();
    }
  });
</script>

{#if isWebSocketOpen}
  {#if FsData.Connected}
    <RadioDisplay
      COM1_ACT_FREQ={FsData.Com1Act}
      COM1_STBY_FREQ={FsData.Com1Stby}
      COM2_ACT_FREQ={FsData.Com2Act}
      COM2_STBY_FREQ={FsData.Com2Stby}
      com1SwitchCallback={com1Switch}
      com2SwitchCallback={com2Switch}
      com1EntryCallback={com1Entry}
      com2EntryCallback={com2Entry}
    />

    <hr class="!border-t-8" />

    {#if FsData.Position.Lat != 0.0 && FsData.Position.Lon != 0.0}
      <VatsimFreqSelector
        lat={FsData.Position.Lat}
        long={FsData.Position.Lon}
        setCom1Callback={com1Entry}
        setCom2Callback={com2Entry}
      />
    {/if}
  {:else}
    <aside class="alert variant-filled-warning m-5">
      <!-- Message -->
      <div class="alert-message">
        <h3 class="h3">FlightSim not Connected to fsConnect</h3>
      </div>
    </aside>
  {/if}
{:else}
  <aside class="alert variant-filled-warning m-5">
    <!-- Message -->
    <div class="alert-message">
      <h3 class="h3">WebSocket connection failed</h3>
    </div>
  </aside>
{/if}
