<script lang="ts">
  import { simbriefData } from "$lib/stores";
  let fontSize = 15; // Base font size in pixels

  function processHtml(html: string, fontSizeValue: number) {
    // Remove all hyperlinks
    let cleanedHtml = html.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");
    // Set custom font size and ensure monospace font
    cleanedHtml = cleanedHtml.replace(/font-size:\s*[\d.]+px/gi, `font-size: ${fontSizeValue}px`);
    cleanedHtml = cleanedHtml.replace(/<pre>/gi, `<pre style="font-family: 'Courier New', Courier, monospace; font-size: ${fontSizeValue}px; line-height: 1.2;">`);
    return cleanedHtml;
  }

  function increaseFontSize() {
    fontSize = Math.min(fontSize + 1, 30); // Max 30px
  }

  function decreaseFontSize() {
    fontSize = Math.max(fontSize - 1, 8); // Min 8px
  }
</script>

{#if $simbriefData}
  <div class="flex flex-col items-center m-1">
    <div class="card inline-block">
      <!-- Font Size Controls -->
      <div class="flex justify-center gap-2 pt-4 pb-2">
        <button
          class="btn variant-filled-primary"
          on:click={decreaseFontSize}
          title="Decrease font size"
        >
          −
        </button>
        <span class="flex items-center px-2 text-sm">Font Size: {fontSize}px</span>
        <button
          class="btn variant-filled-primary"
          on:click={increaseFontSize}
          title="Increase font size"
        >
          +
        </button>
      </div>
      
      <!-- Centered OFP Content -->
      <div class="px-1 py-5">
        {@html processHtml($simbriefData.text.plan_html, fontSize)}
      </div>
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
