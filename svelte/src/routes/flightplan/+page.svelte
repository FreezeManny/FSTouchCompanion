<script lang="js">
  import { onMount } from "svelte";

  let data;
  let htmlExpression = "";
  let customFontSize = "15px"; // Your custom font size

  onMount(async () => {
    console.log("Hello World");
    try {
      const response = await fetch(
        "https://www.simbrief.com/api/xml.fetcher.php?username=" +
          "aplayz" + //settings.simbriefUsername
          "&json=1"
      );
      data = await response.json();
      htmlExpression = setFontSize(data.text.plan_html, customFontSize);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  });

  function setFontSize(html, fontSize) {
    // Use regular expression to find and replace inline font-size styles
    return html.replace(/font-size:\s*[\d.]+px/gi, `font-size: ${fontSize}`);
  }
</script>


<div class="card m-1">
    <div class="px-1 py-5">
        {@html htmlExpression}
    </div>
</div>