<script lang="js">
  import { onMount } from "svelte";

  let data;
  let pdfLink = "";

  onMount(async () => {
    console.log("Hello World");
    try {
      const response = await fetch(
        "https://www.simbrief.com/api/xml.fetcher.php?username=" +
          "aplayz" + //settings.simbriefUsername
          "&json=1",
      );
      data = await response.json();
      pdfLink = data.files.directory + data.files.pdf.link;
      console.log("Link: " + pdfLink);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  });
</script>

<div class="w-screen h-screen flex items-center justify-center">
  <iframe
    title="flightplan"
    src={pdfLink}
    class="w-full h-full border-none"
  />
</div>
