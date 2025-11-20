<script lang="ts">
  import { onMount } from "svelte";
  import { settings } from "$lib/stores";

  // Ensure theme toggles safely on mount and when $settings changes
  onMount(() => {
    if (typeof document !== "undefined") {
      if ($settings.appearance === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    // Wire dialog triggers safely on mount (client only)
    const modal = document.getElementById("settingsModal") as HTMLDialogElement | null;
    const triggers: NodeListOf<HTMLElement> = document.querySelectorAll('[data-dialog-show]');
    triggers.forEach((t) => t.addEventListener("click", () => modal?.showModal()));

    const closeBtns: NodeListOf<HTMLElement> = document.querySelectorAll('[data-dialog-close]');
    closeBtns.forEach((b) => b.addEventListener("click", () => modal?.close()));
  });

  // Reactive update for theme when the setting changes
  $: if (typeof document !== "undefined") {
    if ($settings.appearance === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
</script>

<!-- Replace previous container with the native Dialog element -->
<dialog
  data-dialog
  id="settingsModal"
  class="rounded-container bg-surface-100-900 text-inherit max-w-[640px] top-1/2 left-1/2 -translate-1/2 p-4 space-y-4 z-10 backdrop:bg-surface-50/75 dark:backdrop:bg-surface-950/75"
>
  <div class="container mx-small p-8 space-y-8 preset-filled-surface-500 rounded-sm w-auto">
    <h1 class="h1">Einstellungen</h1>

    <div class="space-y-1">
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <div class="input-group-shim">Appearance:</div>
        <select class="select" bind:value={$settings.appearance}>
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </select>
      </div>

      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <div class="input-group-shim">Simbrief Username:</div>
        <input type="text" bind:value={$settings.simbriefUsername} />
      </div>

      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <div class="input-group-shim">Flight Sim PC Address:</div>
        <input type="text" bind:value={$settings.flightSimAddress} />
      </div>
    </div>

    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
      <div class="input-group-shim">ATC-Platform:</div>
      <select class="select" bind:value={$settings.atcPlatform}>
        <option value="VATSIM">Vatsim</option>
        <option value="IVAO">Ivao</option>
      </select>
    </div>

    <div class="space-y-8 flex flex-col items-center">
      <!-- Use data-dialog-close or call .close() inline -->
      <button type="button" class="btn preset-filled-tertiary-500" data-dialog-close>Close</button>
    </div>
  </div>
</dialog>
