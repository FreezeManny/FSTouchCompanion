<script lang="ts">
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { settings } from "$lib/stores";
  import { Settings, XIcon } from '@lucide/svelte';
  import { createEventDispatcher, onDestroy } from 'svelte';

  export let open = false;
  const dispatch = createEventDispatcher();

  // local fields (no direct binding to $settings)
  let simbriefUsername = "";
  let flightSimAddress = "";
  let atcPlatform = "VATSIM";

  // initialize local fields from store and keep last snapshot
  const unsubscribe = settings.subscribe((s) => {
    simbriefUsername = s?.simbriefUsername ?? "";
    flightSimAddress = s?.flightSimAddress ?? "";
    atcPlatform = s?.atcPlatform ?? "VATSIM";
  });

  onDestroy(() => unsubscribe());

  // exported helpers (like radio keypad)
  export function show() {
    open = true;
  }

  export function close() {
    open = false;
  }

  function onSave() {
    // dispatch the new settings payload to the parent
    dispatch('save', {
      simbriefUsername,
      flightSimAddress,
      atcPlatform
    });
    open = false;
  }

  function onCancel() {
    // simply notify parent and close (parent may decide to reset store)
    dispatch('cancel');
    open = false;
  }
</script>

<Dialog {open} onOpenChange={(details) => (open = details.open)}>
  <Portal>
    <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50/75 dark:bg-surface-950/75" />
    <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
      <Dialog.Content class="card bg-surface-100-900 p-4 space-y-4 shadow-xl w-full max-w-lg">
          <header class="flex justify-between items-center">
            <Dialog.Title class="h3">Einstellungen</Dialog.Title>
            <!-- Use a plain button to avoid TS typing issue on CloseTrigger events -->
            <button type="button" class="btn-icon hover:preset-tonal" on:click={onCancel} aria-label="Close">
              <XIcon class="size-4" />
            </button>
          </header>

            <form class="w-full max-w-md space-y-4 p-4">
            <fieldset class="space-y-4">

              <!-- Simbrief Username Input (local bind) -->
              <label class="label">
                <span class="label-text">Simbrief Username:</span>
                <input class="input" type="text" bind:value={simbriefUsername} placeholder="Enter username" />
              </label>

              <!-- Flight Sim PC Address Input (local bind) -->
              <label class="label">
                <span class="label-text">Flight Sim PC Address:</span>
                <input class="input" type="text" bind:value={flightSimAddress} placeholder="Enter address" />
              </label>

              <!-- ATC Platform Select (local bind) -->
              <label class="label">
                <span class="label-text">ATC-Platform:</span>
                <select class="select" bind:value={atcPlatform}>
                  <option value="VATSIM">Vatsim</option>
                  <option value="IVAO">Ivao</option>
                </select>
              </label>
            </fieldset>

            <!-- Actions -->
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn" on:click={onCancel}>Cancel</button>
              <button type="button" class="btn btn-primary" on:click={onSave}>Save</button>
            </div>
            </form>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>


