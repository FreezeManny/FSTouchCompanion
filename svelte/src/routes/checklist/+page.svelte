<script lang="js">
  import { selectedChecklist } from "$lib/stores";

  $: source = "/checklist/" + $selectedChecklist + ".pdf";
</script>

{#if $selectedChecklist != null}
  <iframe title="Checklist" src={source}  style="border: none;" class="w-full h-full" />
{:else}
  <aside class="alert variant-filled-warning m-5">
    <!-- Message -->
    <div class="alert-message">
      <h3 class="h3">Select a Checklist</h3>
    </div>
  </aside>
{/if}
