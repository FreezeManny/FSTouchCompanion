<script lang="ts">
  import RadioDisplay from "./radio/RadioDisplay.svelte";
  import VatsimFreqSelector from "./frequencySelector/atcFreqSelector.svelte";
  import { 
    websocketStore, 
    isWebSocketOpen, 
    connectionError, 
    fsData,
    com1Switch as ws_com1Switch,
    com2Switch as ws_com2Switch,
    com1Entry as ws_com1Entry,
    com2Entry as ws_com2Entry
  } from "$lib/websocket";

  // Wrapper functions to pass WebSocket from store
  function com1Switch(): void {
    ws_com1Switch($websocketStore);
  }

  function com2Switch(): void {
    ws_com2Switch($websocketStore);
  }

  function com1Entry(frequency: string | number): void {
    ws_com1Entry($websocketStore, frequency);
  }

  function com2Entry(frequency: string | number): void {
    ws_com2Entry($websocketStore, frequency);
  }
</script>

{#if $isWebSocketOpen}
  {#if $fsData.Connected}
    <RadioDisplay
      COM1_ACT_FREQ={$fsData.Com1Act}
      COM1_STBY_FREQ={$fsData.Com1Stby}
      COM2_ACT_FREQ={$fsData.Com2Act}
      COM2_STBY_FREQ={$fsData.Com2Stby}
      com1SwitchCallback={com1Switch}
      com2SwitchCallback={com2Switch}
      com1EntryCallback={com1Entry}
      com2EntryCallback={com2Entry}
    />

    <hr class="border-t-8!" />

    {#if $fsData.Position.Lat != 0.0 && $fsData.Position.Lon != 0.0}
      <VatsimFreqSelector
        lat={$fsData.Position.Lat}
        long={$fsData.Position.Lon}
        setCom1Callback={com1Entry}
        setCom2Callback={com2Entry}
      />
    {/if}
  {:else}
    <aside class="alert preset-filled-warning-500 m-5">
      <!-- Message -->
      <div class="alert-message">
        <h3 class="h3">FlightSim not Connected to fsConnect</h3>
      </div>
    </aside>
  {/if}
{:else}
  <aside class="alert preset-filled-warning-500 m-5">
    <!-- Message -->
    <div class="alert-message">
      <h3 class="h3">WebSocket connection in progress...</h3>
      {#if $connectionError}
        <p class="mt-2 text-sm font-mono bg-surface-900/50 p-2 rounded-sm">{$connectionError}</p>
      {/if}
    </div>
  </aside>
{/if}
