<script lang="ts">
  import { AppBar } from "@skeletonlabs/skeleton-svelte";
  import { onMount, onDestroy } from "svelte";
  import { formatFrequency, isBase64, processData } from "../utils";

  const modalStore = getModalStore();

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

  const COM1_Modal = {
    type: "component" as const,
    component: "radioModal",
    title: "COM1 Frequency-Pad",
    response: (r: number | string | undefined) => { if (r !== undefined) com1EntryCallback(r); },
  };
  const COM2_Modal = {
    type: "component" as const,
    component: "radioModal",
    title: "COM2 Frequency-Pad",
    response: (r: number | string | undefined) => { if (r !== undefined) com2EntryCallback(r); },
  };
</script>

<hr class="border-t-8!" />
<AppBar
  gridColumns="grid-cols-3"
  slotDefault="place-self-center"
  slotTrail="place-content-end"
>
  {#snippet lead()}
  
      <button
        type="button"
        id="btn_COM1"
        class="btn btn-lg preset-filled-primary-500 px-2 font-bold"
      >
        COM1
      </button>
    
  {/snippet}

  <div class="flex justify-center">
    <span class="badge preset-filled p-4">
      <h1 class="h1">
  {formatFrequency(typeof COM1_ACT_FREQ === 'string' ? Number(COM1_ACT_FREQ) : COM1_ACT_FREQ)}
      </h1>
    </span>

    <button
      type="button"
      class="btn btn-lg preset-filled-primary-500 mx-1"
      onclick={com1SwitchCallback}
      aria-label="Switch COM1"
    >
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

    <span class="badge preset-filled p-4">
      <h1 class="h1">
  {formatFrequency(typeof COM1_STBY_FREQ === 'string' ? Number(COM1_STBY_FREQ) : COM1_STBY_FREQ)}
      </h1>
    </span>
  </div>

  {#snippet trail()}
  
      <button
        type="button"
        class="btn btn-lg preset-filled-primary-500"
        onclick={() => modalStore.trigger(COM1_Modal)}
        aria-label="Open COM1 Modal"
      >
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
    
  {/snippet}
</AppBar>

<hr class="border-t-8!" />

<AppBar
  gridColumns="grid-cols-3"
  slotDefault="place-self-center"
  slotTrail="place-content-end"
>
  {#snippet lead()}
  
      <button
        type="button"
        id="btn_COM2"
        class="btn btn-lg preset-filled-primary-500 px-2 font-bold"
      >
        COM2
      </button>
    
  {/snippet}

  <div class="flex justify-center">
    <span class="badge preset-filled p-4">
      <h1 class="h1">
  {formatFrequency(typeof COM2_ACT_FREQ === 'string' ? Number(COM2_ACT_FREQ) : COM2_ACT_FREQ)}
      </h1>
    </span>

    <button
      type="button"
      class="btn btn-lg preset-filled-primary-500 mx-1"
      onclick={com2SwitchCallback}
      aria-label="Switch COM2"
    >
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

    <span class="badge preset-filled p-4">
      <h1 class="h1">
  {formatFrequency(typeof COM2_STBY_FREQ === 'string' ? Number(COM2_STBY_FREQ) : COM2_STBY_FREQ)}
      </h1>
    </span>
  </div>

  {#snippet trail()}
  
      <button
        type="button"
        class="btn btn-lg preset-filled-primary-500"
        onclick={() => modalStore.trigger(COM2_Modal)}
        aria-label="Open COM2 Modal"
      >
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
    
  {/snippet}
</AppBar>
