<script lang="js">
  import Radio from "./radio/Radio.svelte";
  import NewRadio from "./radio/RadioDisplay.svelte";
  import VatsimFreqSelector from "./frequencySelector/atcFreqSelector.svelte";

  const currentLatitude = 48.6892413019329; // Example latitude
  const currentLongitude = 9.20086335034953; // Example longitude

  function com1Switch() {
    console.log("COM1 Switch Button Clicked");
  }

  function com2Switch() {
    console.log("COM2 Switch Button Clicked");
  }

  function com1Entry(frequency){
    console.log("COM1 Frequency Changed to: " + frequency);
  }

  function com2Entry(frequency){
    console.log("COM2 Frequency Changed to: " + frequency);
  }

</script>

<Radio />

<VatsimFreqSelector lat={currentLatitude} long={currentLongitude} />
