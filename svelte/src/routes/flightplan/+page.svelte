<script lang="ts">
  import { simbriefData, flightplanSettings } from "$lib/stores";

  let scrollContainer = $state<HTMLElement>();
  let hasRestored = $state(false);

  $effect(() => {
    if (!hasRestored) {
      restoreScroll();
    }
  });

  function restoreScroll() {
    if (scrollContainer && $flightplanSettings.scrollPosition && !hasRestored) {
      scrollContainer.scrollTop = $flightplanSettings.scrollPosition;
      hasRestored = true;
    }
  }

  function handleScroll() {
    if (scrollContainer) {
      $flightplanSettings.scrollPosition = scrollContainer.scrollTop;
    }
  }

  function processHtml(html: string, fontSizeValue: number) {
    // Remove all hyperlinks
    let cleanedHtml = html.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");
    // Set custom font size and ensure monospace font
    cleanedHtml = cleanedHtml.replace(/font-size:\s*[\d.]+px/gi, `font-size: ${fontSizeValue}px`);
    cleanedHtml = cleanedHtml.replace(/<pre>/gi, `<pre style="font-family: 'Courier New', Courier, monospace; font-size: ${fontSizeValue}px; line-height: 1.2;">`);
    return cleanedHtml;
  }

  function increaseFontSize() {
    $flightplanSettings.fontSize = Math.min($flightplanSettings.fontSize + 1, 30); // Max 30px
  }

  function decreaseFontSize() {
    $flightplanSettings.fontSize = Math.max($flightplanSettings.fontSize - 1, 8); // Min 8px
  }
</script>

{#if $simbriefData}
  <div class="h-full overflow-y-auto" bind:this={scrollContainer} onscroll={handleScroll}>
    <div class="flex flex-col items-center m-1">
      <div class="card inline-block preset-filled-surface-100-900">
        <!-- Centered OFP Content -->
        <div class="px-1 py-5">
          {@html processHtml($simbriefData.text.plan_html, $flightplanSettings.fontSize)}
        </div>
      </div>
    </div>
    
    <!-- Floating Zoom Controls -->
    <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      <button
        class="btn preset-filled w-11 h-11 shadow-lg"
        onclick={increaseFontSize}
        title="Increase font size"
      >
        +
      </button>
      <button
        class="btn preset-filled w-11 h-11 shadow-lg"
        onclick={decreaseFontSize}
        title="Decrease font size"
      >
        -
      </button>
    </div>
  </div>
{:else}
  <aside class="alert preset-filled-warning-500 m-5">
    <!-- Message -->
    <div class="alert-message">
      <h3 class="h3">Load a valid Flightplan</h3>
    </div>
  </aside>
{/if}