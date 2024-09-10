<script lang="js">
  import { onMount } from "svelte";

  import { flightPlanCache } from "$lib/stores";

  let data;
  let customFontSize = "15px"; // Your custom font size

  onMount(async () => {
    try {
      const response = await fetch("https://www.simbrief.com/api/xml.fetcher.php?username=" + "aplayz" + "&json=1");
      data = await response.json();
      $flightPlanCache = processHtml(data.text.plan_html, customFontSize);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  });

  function processHtml(html, fontSize) {
    // Remove all hyperlinks
    let cleanedHtml = html.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");
    // Set custom font size
    cleanedHtml = cleanedHtml.replace(/font-size:\s*[\d.]+px/gi, `font-size: ${fontSize}`);
    return cleanedHtml;
  }
</script>

<div class="card m-1">
  <div class="px-1 py-5">
    {@html $flightPlanCache}
  </div>
</div>
