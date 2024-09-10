<script lang="js">
  import { onMount } from "svelte";
  import { flightPlanCache, settings } from "$lib/stores";
  import { getToastStore } from "@skeletonlabs/skeleton";
  const toastStore = getToastStore();

  const simbriefError = (message) => ({
    message: message,
    timeout: 5000,
    hoverable: true,
    background: "variant-filled-error",
  });

  let data;
  let customFontSize = "15px"; // Your custom font size

  onMount(async () => {
    loadNewFlightplan();
  });

  async function loadNewFlightplan() {
    const fetchURL = "https://www.simbrief.com/api/xml.fetcher.php?username=" + $settings.simbriefUsername + "&json=1";
    try {
      const response = await fetch(fetchURL);
      const data = await response.json();

      if (data.fetch.status == "Success") {
        $flightPlanCache = processHtml(data.text.plan_html, customFontSize);
      } else {
        $flightPlanCache = "";
        toastStore.trigger(simbriefError("Simbrief: " + data.fetch.status));
      }
    } catch (error) {}
  }

  function processHtml(html, fontSize) {
    // Remove all hyperlinks
    let cleanedHtml = html.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");
    // Set custom font size
    cleanedHtml = cleanedHtml.replace(/font-size:\s*[\d.]+px/gi, `font-size: ${fontSize}`);
    return cleanedHtml;
  }
</script>

{#if $flightPlanCache && $flightPlanCache.length > 0}
  <div class="card m-1">
    <div class="px-1 py-5">
      {@html $flightPlanCache}
    </div>
  </div>
{:else}
  <aside class="alert variant-filled-warning m-5">
    <!-- Message -->
    <div class="alert-message">
      <h3 class="h3">No Flightplan Found</h3>
    </div>
  </aside>
{/if}
