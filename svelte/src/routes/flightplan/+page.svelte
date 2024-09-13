<script lang="js">
  import { simbriefData } from "$lib/stores";
  let customFontSize = "15px"; // Your custom font size

  function processHtml(html, fontSize) {
    // Remove all hyperlinks
    let cleanedHtml = html.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");
    // Set custom font size
    cleanedHtml = cleanedHtml.replace(/font-size:\s*[\d.]+px/gi, `font-size: ${fontSize}`);
    return cleanedHtml;
  }
</script>

{#if $simbriefData}
  <div class="card m-1">
    <div class="px-1 py-5">
      {@html processHtml($simbriefData.text.plan_html, customFontSize)}
    </div>
  </div>
{:else}
  <aside class="alert variant-filled-warning m-5">
    <!-- Message -->
    <div class="alert-message">
      <h3 class="h3">Load a valid Flightplan</h3>
    </div>
  </aside>
{/if}
