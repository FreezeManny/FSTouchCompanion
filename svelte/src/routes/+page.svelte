<script lang="js">
  import { settings, simbriefData } from "$lib/stores";
  import { getToastStore } from "@skeletonlabs/skeleton";
  const toastStore = getToastStore();

  const simbriefError = (message) => ({
    message: message,
    timeout: 5000,
    hoverable: true,
    background: "variant-filled-error",
  });

  async function getFlightPlan() {
    const fetchURL = "https://www.simbrief.com/api/xml.fetcher.php?username=" + $settings.simbriefUsername + "&json=1";
    try {
      const response = await fetch(fetchURL);
      const data = await response.json();

      if (data.fetch.status == "Success") {
        $simbriefData = data;
	} else {
		$simbriefData = {};
        toastStore.trigger(simbriefError("Simbrief: " + data.fetch.status));
      }
    } catch (error) {}
  }



</script>

<h1 class="h1">Homepage</h1>

<button type="button" class="btn variant-filled" on:click={getFlightPlan}>Load Flight</button>
