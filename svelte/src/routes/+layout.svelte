<script lang="ts">
	import './layout.css';
	import Header from "./Header.svelte";

import { Toast } from '@skeletonlabs/skeleton-svelte';
import { toaster } from '$lib/toaster';

	// WebSocket Management
	import { onMount, onDestroy } from "svelte";
	import { settings } from "$lib/stores";
	import { websocketStore, isWebSocketOpen, connectionError, fsData, retryConnectionCallback } from "$lib/websocket";

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const favicon = '/favicon.png';

	const wsPort = "8080";
let ws: WebSocket;
let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
const CONNECTION_TIMEOUT_MS = 5000;

function retryConnection() {
  console.log("[WebSocket] Manual retry triggered");
  
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
  
  if (ws) {
    ws.close();
  }
  
  const wsAddress = `ws://${$settings.flightSimAddress}:${wsPort}/ws`;
  connectWebSocket(wsAddress);
}

onMount(() => {
  // Expose retry function to other components
  retryConnectionCallback.set(retryConnection);
  
  // Set initial message prompting user to connect
  connectionError.set("Click 'Connect' to establish connection");
});

function connectWebSocket(wsAddress: string) {
  try {
    // Close existing connection if any (important for iOS Safari)
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
        return setTimeout(() => connectWebSocket(wsAddress), 50);
      }
    }
    
    connectionError.set("Connecting...");
    
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
    
    connectionTimeout = setTimeout(() => {
      if (ws && ws.readyState !== WebSocket.OPEN) {
        console.log("[WebSocket] Connection timeout");
        connectionError.set(`Connection timeout after ${CONNECTION_TIMEOUT_MS / 1000}s. Server may be unreachable.`);
        if (ws) {
          ws.close();
        }
      }
    }, CONNECTION_TIMEOUT_MS);
    
    const startTime = Date.now();
    
    // Safari-specific: Ensure we're creating a clean WebSocket
    try {
      ws = new WebSocket(wsAddress);
      ws.binaryType = 'arraybuffer';
      websocketStore.set(ws);
    } catch (wsError) {
      console.error("[WebSocket] Failed to create:", wsError);
      throw wsError;
    }
    
    ws.onopen = () => {
      console.log("[WebSocket] Connected");
      
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      isWebSocketOpen.set(true);
      connectionError.set("");
    };
    
    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        fsData.update((data) => {
          if (message.Connected !== undefined) {
            data.Connected = message.Connected;
          }
          if (message.Position) {
            data.Position = { ...data.Position, ...message.Position };
          }
          if (message.Com1Stby) {
            data.Com1Stby = message.Com1Stby;
          }
          if (message.Com1Act) {
            data.Com1Act = message.Com1Act;
          }
          if (message.Com2Stby) {
            data.Com2Stby = message.Com2Stby;
          }
          if (message.Com2Act) {
            data.Com2Act = message.Com2Act;
          }
          return data;
        });
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    ws.onclose = (event: CloseEvent) => {
      console.log("[WebSocket] Closed - Code:", event.code);
      
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      isWebSocketOpen.set(false);
      
      let errorMsg = "";
      switch (event.code) {
        case 1000:
          errorMsg = "Connection closed normally";
          break;
        case 1006:
          errorMsg = "Code 1006: Connection failed. Server may not be reachable.";
          break;
        case 1001:
          errorMsg = "Server is going away";
          break;
        case 1002:
          errorMsg = "Protocol error";
          break;
        case 1003:
          errorMsg = "Unsupported data";
          break;
        default:
          errorMsg = `Connection closed - Code: ${event.code}`;
      }
      connectionError.set(errorMsg);
    };
    
    ws.onerror = (error: Event) => {
      console.error("[WebSocket] Error:", error.type);
      isWebSocketOpen.set(false);
      connectionError.set("WebSocket error occurred");
    };
  } catch (error) {
    console.error("[WebSocket] Exception:", error);
    isWebSocketOpen.set(false);
    connectionError.set(`Failed to create WebSocket: ${error}`);
  }
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

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="h-full w-full flex flex-col overflow-hidden">
  <header class="flex-none">
    <Header></Header>
  </header>
  <div class="flex-auto overflow-y-auto">
    {#if children}
      {@render children()}
    {/if}
  </div>
  <Toast.Group {toaster}>
    {#snippet children(toast)}
      <Toast {toast}>
        <Toast.Message>
          <Toast.Title>{toast.title}</Toast.Title>
          <Toast.Description>{toast.description}</Toast.Description>
        </Toast.Message>
        <Toast.CloseTrigger />
      </Toast>
    {/snippet}
  </Toast.Group>
</div>
