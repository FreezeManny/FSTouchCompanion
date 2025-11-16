<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { settings } from "$lib/stores";
  import RadioDisplay from "./radio/RadioDisplay.svelte";
  import VatsimFreqSelector from "./frequencySelector/atcFreqSelector.svelte";

  let isWebSocketOpen: boolean = false;
  let connectionError: string = "";
  let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  const CONNECTION_TIMEOUT_MS = 5000; // 5 seconds

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
  let wsAddress: string;
  let ws: WebSocket;

  onMount(() => {
    // Build WebSocket address from settings
    wsAddress = `ws://${$settings.flightSimAddress}:${wsPort}/ws`;
    
    // Add a small delay for Safari on iOS to ensure the page is fully ready
    // Safari sometimes needs a moment after onMount before WebSocket connections work
    setTimeout(() => {
      webSocketFunction();
    }, 100);
  });

  function webSocketFunction() {
    try {
      connectionError = "Connecting...";
      
      // Clear any existing timeout
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      
      // Set a connection timeout
      connectionTimeout = setTimeout(() => {
        if (!isWebSocketOpen && ws.readyState !== WebSocket.OPEN) {
          connectionError = `Connection timeout after ${CONNECTION_TIMEOUT_MS / 1000}s. Server may be unreachable from this device.`;
          if (ws) {
            ws.close();
          }
        }
      }, CONNECTION_TIMEOUT_MS);
      
      ws = new WebSocket(wsAddress);
      console.log("WebSocket connecting to:", wsAddress);

      ws.onopen = () => {
        console.log("WebSocket connection established");
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        isWebSocketOpen = true;
        connectionError = "";
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
          connectionError = `Parse error: ${error}`;
        }
      };

      ws.onclose = (event: CloseEvent) => {
        console.log("WebSocket connection closed", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        isWebSocketOpen = false;
        
        // More descriptive error messages for common close codes
        let errorMsg = "";
        switch (event.code) {
          case 1006:
            errorMsg = "Code 1006: Connection failed or was terminated abnormally. The server at " + wsAddress + " may not be reachable from Safari on this device. Try checking: 1) Server is running, 2) IP address is correct in settings, 3) Device can reach the server network.";
            break;
          default:
            errorMsg = `Connection closed - Code: ${event.code}, Reason: ${event.reason || "None"}, Clean: ${event.wasClean}`;
        }
        connectionError = errorMsg;
      };

      ws.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
        isWebSocketOpen = false;
        connectionError = `WebSocket error occurred. Browser: ${navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}`;
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      isWebSocketOpen = false;
      connectionError = `Failed to create WebSocket: ${error}`;
    }
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

  function retryWebSocketConnection(): void {
    console.log("Manual retry triggered");
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    if (ws) {
      ws.close();
    }
    // Rebuild WebSocket address in case settings changed
    wsAddress = `ws://${$settings.flightSimAddress}:${wsPort}/ws`;
    webSocketFunction();
  }

  onDestroy(() => {
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
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
      <p class="mt-2">Unable to connect to {wsAddress}</p>
      {#if connectionError}
        <p class="mt-2 text-sm font-mono bg-surface-900/50 p-2 rounded">{connectionError}</p>
      {/if}
    </div>
    <!-- Actions -->
    <div class="alert-actions">
      <button class="btn variant-filled" on:click={retryWebSocketConnection}>
        Retry Connection
      </button>
    </div>
  </aside>
{/if}
