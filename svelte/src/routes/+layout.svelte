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
  console.log("[WebSocket] Current settings:", {
    flightSimAddress: $settings.flightSimAddress,
    wsPort,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent
  });
  
  if (connectionTimeout) {
    console.log("[WebSocket] Clearing existing connection timeout");
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
  
  if (ws) {
    console.log("[WebSocket] Closing existing WebSocket, current state:", ws.readyState);
    ws.close();
  }
  
  const wsAddress = `ws://${$settings.flightSimAddress}:${wsPort}/ws`;
  console.log("[WebSocket] Retry connection to:", wsAddress);
  connectWebSocket(wsAddress);
}

onMount(() => {
  console.log("[WebSocket] onMount called");
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  console.log("[WebSocket] Environment:", {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    onLine: navigator.onLine,
    protocol: window.location.protocol,
    host: window.location.host,
    documentReadyState: document.readyState,
    isSafari
  });
  
  // Expose retry function to other components
  retryConnectionCallback.set(retryConnection);
  
  const initConnection = () => {
    const wsAddress = `ws://${$settings.flightSimAddress}:${wsPort}/ws`;
    console.log("[WebSocket] Initializing WebSocket connection");
    console.log("[WebSocket] Target address:", wsAddress);
    console.log("[WebSocket] Settings:", $settings);
    connectWebSocket(wsAddress);
  };
  
  // Safari needs different timing - wait for full page load
  if (isSafari) {
    console.log("[WebSocket] Safari detected - using delayed initialization");
    if (document.readyState === 'complete') {
      // Page already loaded, wait a bit longer for Safari
      setTimeout(initConnection, 500);
    } else {
      // Wait for full page load
      window.addEventListener('load', () => {
        console.log("[WebSocket] Page load complete, initializing in 500ms");
        setTimeout(initConnection, 500);
      });
    }
  } else {
    // Other browsers can connect faster
    requestAnimationFrame(initConnection);
  }
});

function connectWebSocket(wsAddress: string) {
  try {
    console.log("[WebSocket] connectWebSocket called with:", wsAddress);
    
    // Close existing connection if any (important for iOS Safari)
    if (ws) {
      const state = ws.readyState;
      const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
      console.log(`[WebSocket] Existing WebSocket found - State: ${state} (${stateNames[state]})`);
      
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        console.log("[WebSocket] Closing existing connection before retry");
        ws.close();
        // Small delay to ensure cleanup on iOS
        console.log("[WebSocket] Waiting 50ms for cleanup before reconnecting...");
        return setTimeout(() => connectWebSocket(wsAddress), 50);
      }
    }
    
    console.log("[WebSocket] Setting connection status to 'Connecting...'");
    connectionError.set("Connecting...");
    
    if (connectionTimeout) {
      console.log("[WebSocket] Clearing previous connection timeout");
      clearTimeout(connectionTimeout);
    }
    
    console.log(`[WebSocket] Setting connection timeout: ${CONNECTION_TIMEOUT_MS}ms`);
    connectionTimeout = setTimeout(() => {
      if (ws && ws.readyState !== WebSocket.OPEN) {
        const state = ws.readyState;
        const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
        console.log(`[WebSocket] Connection timeout! State: ${state} (${stateNames[state]})`);
        connectionError.set(`Connection timeout after ${CONNECTION_TIMEOUT_MS / 1000}s. Server may be unreachable.`);
        if (ws) {
          ws.close();
        }
      }
    }, CONNECTION_TIMEOUT_MS);
    
    console.log("[WebSocket] Creating new WebSocket instance...");
    const startTime = Date.now();
    
    // Safari-specific: Ensure we're creating a clean WebSocket
    try {
      ws = new WebSocket(wsAddress);
      console.log(`[WebSocket] WebSocket object created in ${Date.now() - startTime}ms`);
      console.log("[WebSocket] Initial readyState:", ws.readyState);
      
      // Safari sometimes needs explicit binaryType setting
      ws.binaryType = 'arraybuffer';
      
      websocketStore.set(ws);
    } catch (wsError) {
      console.error("[WebSocket] Failed to create WebSocket object:", wsError);
      throw wsError;
    }
    
    ws.onopen = () => {
      const elapsed = Date.now() - startTime;
      console.log(`[WebSocket] ✓ Connection OPENED successfully in ${elapsed}ms`);
      console.log("[WebSocket] readyState:", ws.readyState);
      console.log("[WebSocket] protocol:", ws.protocol);
      console.log("[WebSocket] extensions:", ws.extensions);
      
      if (connectionTimeout) {
        console.log("[WebSocket] Clearing connection timeout");
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      console.log("[WebSocket] Setting isWebSocketOpen = true");
      isWebSocketOpen.set(true);
      connectionError.set("");
    };
    
    ws.onmessage = (event: MessageEvent) => {
      console.log("[WebSocket] Message received:", event.data);
      try {
        const message = JSON.parse(event.data);
        console.log("[WebSocket] Parsed message:", message);
        
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
      console.log("[WebSocket] ✗ Connection CLOSED");
      console.log("[WebSocket] Close event details:", {
        code: event.code,
        reason: event.reason || '(no reason provided)',
        wasClean: event.wasClean,
        timestamp: new Date().toISOString()
      });
      
      if (connectionTimeout) {
        console.log("[WebSocket] Clearing connection timeout on close");
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      console.log("[WebSocket] Setting isWebSocketOpen = false");
      isWebSocketOpen.set(false);
      
      let errorMsg = "";
      switch (event.code) {
        case 1000:
          console.log("[WebSocket] Normal closure");
          errorMsg = "Connection closed normally";
          break;
        case 1006:
          console.log("[WebSocket] Abnormal closure - connection lost");
          errorMsg = "Code 1006: Connection failed. Server may not be reachable.";
          break;
        case 1001:
          console.log("[WebSocket] Endpoint going away");
          errorMsg = "Server is going away";
          break;
        case 1002:
          console.log("[WebSocket] Protocol error");
          errorMsg = "Protocol error";
          break;
        case 1003:
          console.log("[WebSocket] Unsupported data");
          errorMsg = "Unsupported data";
          break;
        default:
          console.log(`[WebSocket] Unknown close code: ${event.code}`);
          errorMsg = `Connection closed - Code: ${event.code}`;
      }
      connectionError.set(errorMsg);
    };
    
    ws.onerror = (error: Event) => {
      console.error("[WebSocket] ✗ ERROR event fired");
      console.error("[WebSocket] Error details:", {
        type: error.type,
        target: error.target,
        currentTarget: error.currentTarget,
        timestamp: new Date().toISOString(),
        readyState: ws ? ws.readyState : 'undefined'
      });
      console.error("[WebSocket] Full error object:", error);
      
      console.log("[WebSocket] Setting isWebSocketOpen = false");
      isWebSocketOpen.set(false);
      connectionError.set("WebSocket error occurred");
    };
  } catch (error) {
    console.error("[WebSocket] ✗ EXCEPTION in connectWebSocket");
    console.error("[WebSocket] Exception type:", error instanceof Error ? error.name : typeof error);
    console.error("[WebSocket] Exception message:", error instanceof Error ? error.message : error);
    console.error("[WebSocket] Stack trace:", error instanceof Error ? error.stack : 'N/A');
    
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
