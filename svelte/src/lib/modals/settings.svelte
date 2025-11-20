<script lang="ts">
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { settings } from "$lib/stores";
  import { Settings } from '@lucide/svelte';

  export let open = false;

</script>

<Dialog {open} onOpenChange={(details) => (open = details.open)}>
  <Dialog.Trigger class="btn btn-icon preset-filled">
    <Settings /> 
  </Dialog.Trigger>

  <Portal>
    <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50/75 dark:bg-surface-950/75" />
    <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
      <Dialog.Content class="card bg-surface-100-900 p-4 space-y-4 shadow-xl w-full max-w-lg">
          <Dialog.Title class="h3">Einstellungen</Dialog.Title>

            <form class="w-full max-w-md space-y-4 p-4">
            <fieldset class="space-y-4">

              <!-- Simbrief Username Input -->
              <label class="label">
                <span class="label-text">Simbrief Username:</span>
                <input class="input" type="text" bind:value={$settings.simbriefUsername} placeholder="Enter username" />
              </label>

              <!-- Flight Sim PC Address Input -->
              <label class="label">
                <span class="label-text">Flight Sim PC Address:</span>
                <input class="input" type="text" bind:value={$settings.flightSimAddress} placeholder="Enter address" />
              </label>

              <!-- ATC Platform Select -->
              <label class="label">
                <span class="label-text">ATC-Platform:</span>
                <select class="select" bind:value={$settings.atcPlatform}>
                  <option value="VATSIM">Vatsim</option>
                  <option value="IVAO">Ivao</option>
                </select>
              </label>
            </fieldset>



            <fieldset class="flex justify-center pt-4">
              <Dialog.CloseTrigger class="btn preset-filled-tertiary-500">
                Close
              </Dialog.CloseTrigger>
            </fieldset>

      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
