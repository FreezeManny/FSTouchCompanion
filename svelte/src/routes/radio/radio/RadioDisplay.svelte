<script lang="ts">
  import { AppBar } from "@skeletonlabs/skeleton-svelte";
  import { formatFrequency, isBase64, processData } from "../utils";
  import RadioKeypad from "$lib/modals/radioKeypad.svelte";
  import { ArrowLeftRight , Grid2x2 } from '@lucide/svelte';

  interface Props {
    COM1_ACT_FREQ: number | string;
    COM1_STBY_FREQ: number | string;
    COM2_ACT_FREQ: number | string;
    COM2_STBY_FREQ: number | string;
    com1SwitchCallback: () => void;
    com2SwitchCallback: () => void;
    com1EntryCallback: (r: number | string) => void;
    com2EntryCallback: (r: number | string) => void;
  }

  let {
    COM1_ACT_FREQ,
    COM1_STBY_FREQ,
    COM2_ACT_FREQ,
    COM2_STBY_FREQ,
    com1SwitchCallback,
    com2SwitchCallback,
    com1EntryCallback,
    com2EntryCallback
  }: Props = $props();

  let keypadOpen = $state(false);
  let selectedCom: "COM1" | "COM2" = $state("COM1");

  function openKeypad(com: "COM1" | "COM2") {
    selectedCom = com;
    keypadOpen = true;
  }

  function handleKeypadSubmit(value: number) {
    if (selectedCom === "COM1") {
      com1EntryCallback?.(value);
    } else {
      com2EntryCallback?.(value);
    }
  }
</script>

<div class="flex flex-col p-2">
  <div class="card my-2 preset-filled-surface-100-900">
    <section class="p-2">
      <AppBar>
        <AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
          <AppBar.Lead>
            <button
              type="button"
              id="btn_COM1"
              class="btn btn-lg preset-filled-primary-500 px-2 font-bold"
            >
              COM1
            </button>
          </AppBar.Lead>

          <AppBar.Headline class="flex justify-center">
            <span class="badge preset-filled p-4">
              <h1 class="h1 font-mono">
                {formatFrequency(typeof COM1_ACT_FREQ === 'string' ? Number(COM1_ACT_FREQ) : COM1_ACT_FREQ)}
              </h1>
            </span>

            <button
              type="button"
              class="btn btn-lg preset-filled-primary-500 mx-1"
              onclick={com1SwitchCallback}
              aria-label="Switch COM1"
            >
              <ArrowLeftRight />
            </button>

            <span class="badge preset-filled p-4">
              <h1 class="h1 font-mono">
                {formatFrequency(typeof COM1_STBY_FREQ === 'string' ? Number(COM1_STBY_FREQ) : COM1_STBY_FREQ)}
              </h1>
            </span>
          </AppBar.Headline>

          <AppBar.Trail class="justify-end">
            <button
              type="button"
              class="btn btn-lg preset-filled-primary-500"
              onclick={() => openKeypad("COM1")}
              aria-label="Open COM1 Modal"
            >
             <Grid2x2 /> 
            </button>
          </AppBar.Trail>
        </AppBar.Toolbar>
      </AppBar>

      <hr class="border-t-4 my-2" />

      <AppBar>
        <AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
          <AppBar.Lead>
            <button
              type="button"
              id="btn_COM2"
              class="btn btn-lg preset-filled-primary-500 px-2 font-bold"
            >
              COM2
            </button>
          </AppBar.Lead>

          <AppBar.Headline class="flex justify-center">
            <span class="badge preset-filled p-4">
              <h1 class="h1 font-mono">
                {formatFrequency(typeof COM2_ACT_FREQ === 'string' ? Number(COM2_ACT_FREQ) : COM2_ACT_FREQ)}
              </h1>
            </span>

            <button
              type="button"
              class="btn btn-lg preset-filled-primary-500 mx-1"
              onclick={com2SwitchCallback}
              aria-label="Switch COM2"
            >
              <ArrowLeftRight />
            </button>

            <span class="badge preset-filled p-4">
              <h1 class="h1 font-mono">
                {formatFrequency(typeof COM2_STBY_FREQ === 'string' ? Number(COM2_STBY_FREQ) : COM2_STBY_FREQ)}
              </h1>
            </span>
          </AppBar.Headline>

          <AppBar.Trail class="justify-end">
            <button
              type="button"
              class="btn btn-lg preset-filled-primary-500"
              onclick={() => openKeypad("COM2")}
              aria-label="Open COM2 Modal"
            >
             <Grid2x2 /> 
            </button>
          </AppBar.Trail>
        </AppBar.Toolbar>
      </AppBar>
    </section>
  </div>
</div>

<RadioKeypad 
  bind:open={keypadOpen} 
  onSubmit={handleKeypadSubmit}
/>
