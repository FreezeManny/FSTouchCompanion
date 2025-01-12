<script lang="js">
  import Radio from "./Radio.svelte";
  import VatsimFreqSelector from "./VatsimFreqSelector.svelte";

  const currentLatitude = 48.6892413019329; // Example latitude
  const currentLongitude = 9.20086335034953; // Example longitude
</script>

<Radio />

<VatsimFreqSelector lat={currentLatitude} long={currentLongitude} />