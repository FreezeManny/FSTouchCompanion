<script>
  import { onMount, onDestroy } from "svelte";
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import { settings } from "$lib/stores";

  var mcduOnline = false;

  let interval;

  onMount(async () => {
    checkAlive();
    interval = setInterval(checkAlive, 2000);
  });
  onDestroy(async () => {
    clearInterval(interval);
  });

  async function checkAlive() {
    try {
      const response = await fetch("http://" + $settings.flightSimAddress + ":8083/#/mcdu");
      //console.log("Server There");
      mcduOnline = true;
    } catch (error) {
      mcduOnline = false;
      //console.log("Failed to fetch data:", error);
    }
  }
</script>

{#if mcduOnline}
  <iframe
    title="MCDU"
    src={"http://" + $settings.flightSimAddress + ":8083/#/mcdu"}
    style="border: none;"
    class="w-full h-full"
  />
{:else}
  <div class="h-full flex items-center justify-center">
    <div class="flex flex-col items-center">
      <ProgressRadial class="w-56 pb-5" />
      <h1 class="h1">Connecting....</h1>
      <p>Make sure the Fenix Aircraft is running</p>
    </div>
  </div>
{/if}
