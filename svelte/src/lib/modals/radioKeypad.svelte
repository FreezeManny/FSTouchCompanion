<script lang="ts">
  import KeypadButton from "./KeypadButton.svelte";
  import { XIcon } from '@lucide/svelte';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';

  // Optional animation helper used on Dialog.Content
  const animation =
  	'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';

  let { title = "Radio Keypad", onSubmit, open = $bindable(false) }: { title?: string; onSubmit?: (value: number) => void, open?: boolean } = $props();

  let frequency = $state<string>("XXX.XXX");
  // validFrequencies is constant data, no need for $state
  const validFrequencies = generateValidFrequencies();
  // buttonsEnabled is derived from frequency, no need to manually update it
  let buttonsEnabled = $derived(getPossibleNumbers(frequency, validFrequencies));

  // Reset display when opened (use $effect instead of $: in runes mode)
  $effect(() => {
    if (open) {
      frequency = "XXX.XXX";
    }
  });

  export function show() {
    open = true;
  }

  export function close() {
    open = false;
  }

  function generateValidFrequencies(): string[] {
    const startFrequency = 117.975;
    const endFrequency = 137.0;
    const step = 0.005;
    const excludedPatterns = ["20", "45", "70", "95"];

    let frequencies: string[] = [];

    for (let freq = startFrequency; freq <= endFrequency; freq = parseFloat((freq + step).toFixed(3))) {
      let freqStr = freq.toFixed(3); // Convert frequency to a string with 3 decimal places
      let decimalPart = freqStr.slice(-3); // Get the last three characters of the string (e.g., "975")

      if (!excludedPatterns.includes(decimalPart.slice(-2))) {
        // Check if the last two digits are in the excluded list
        frequencies.push(freqStr);
      }
    }

    return frequencies;
  }

  function getPossibleNumbers(frequency: string, validFrequencies: string[]): string {
    // Get the index of the first 'X'
    const index = frequency.indexOf("X");

    // If there's no 'X', return an empty string
    if (index === -1) {
      return "";
    }

    // Create a base frequency string from the current frequency
    const baseFrequency = frequency.substring(0, index);

    // Create a list to hold possible digits
    let possibleDigits = "";

    // Iterate through valid frequencies to find matches
    validFrequencies.forEach((validFreq) => {
      // Check if the base frequency matches the start of the valid frequency
      if (validFreq.startsWith(baseFrequency)) {
        // Get the next digit in the valid frequency at the index of the 'X'
        const nextDigit = validFreq[index];

        // Add the digit to the possibleDigits string if it's not already included
        if (!possibleDigits.includes(nextDigit)) {
          possibleDigits += nextDigit;
        }
      }
    });

    return possibleDigits;
  }

  function addDigit(digit: string): void {
    // Find the index of the first 'X'
    const index = frequency.indexOf("X");

    if (index !== -1) {
      // Replace the first 'X' with the entered digit
      frequency = frequency.substring(0, index) + digit + frequency.substring(index + 1);
    }
  }

  function removeLastDigit(): void {
    // Start from the last character and move backwards
    let index = frequency.length - 1;

    // Move index back until we find a non-'X' character that is not '.'
    while (index >= 0 && (frequency[index] === "X" || frequency[index] === ".")) {
      index--;
    }

    // Replace the last digit with 'X' if found
    if (index >= 0) {
      frequency = frequency.substring(0, index) + "X" + frequency.substring(index + 1);
    }
  }

  function removeDecimal(num: string | number): number {
    // Convert the number to a string
    let numStr = num.toString();

    // Remove the decimal point
    let resultStr = numStr.replace(".", "");

    // Convert back to a number and return
    return parseInt(resultStr, 10);
  }
  //--------------------------------------------------
  //Button Handler

  // Handle button clicks and log the value
  function onNumberInput(value: string): void {
    //console.log(value);
    addDigit(value);
  }

  function onRemove(): void {
    console.log("Remove");
    removeLastDigit();
  }

  function onEnter(): void {
    onSubmit?.(removeDecimal(frequency));
    close();
  }

  function onCancel(): void {
    close();
  }
</script>

{#if open}
  <Dialog>
    <Portal>
      <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
      <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
        <Dialog.Content class="card bg-surface-100-900 w-full max-w-xl p-0 space-y-0 shadow-xl {animation}">
          <div class="container mx-small rounded w-auto overflow-hidden">
            <!-- Header: primary -->
            <header class="flex justify-between items-center p-6 preset-filled-primary-500 text-on-primary">
              <Dialog.Title class="h1 m-0">{title}</Dialog.Title>
              <Dialog.CloseTrigger class="btn btn-icon preset-filled-warning-500" aria-label="Close">
                <XIcon />
              </Dialog.CloseTrigger>
            </header>

            <!-- Frequency display: white background and black text -->
            <div class="mx-auto my-6 p-8 text-center bg-white text-black rounded-md shadow-sm">
              <h1 class="h1 m-0 font-mono text-black">{frequency}</h1>
            </div>

            <!-- Keypad grid -->
            <div class="grid grid-cols-3 gap-2 rounded-xl max-w-sm mx-auto mt-6 p-4">
              <KeypadButton label="1" onclick={() => onNumberInput("1")} disabled={!buttonsEnabled.includes("1")} />
              <KeypadButton label="2" onclick={() => onNumberInput("2")} disabled={!buttonsEnabled.includes("2")} />
              <KeypadButton label="3" onclick={() => onNumberInput("3")} disabled={!buttonsEnabled.includes("3")} />
              <KeypadButton label="4" onclick={() => onNumberInput("4")} disabled={!buttonsEnabled.includes("4")} />
              <KeypadButton label="5" onclick={() => onNumberInput("5")} disabled={!buttonsEnabled.includes("5")} />
              <KeypadButton label="6" onclick={() => onNumberInput("6")} disabled={!buttonsEnabled.includes("6")} />
              <KeypadButton label="7" onclick={() => onNumberInput("7")} disabled={!buttonsEnabled.includes("7")} />
              <KeypadButton label="8" onclick={() => onNumberInput("8")} disabled={!buttonsEnabled.includes("8")} />
              <KeypadButton label="9" onclick={() => onNumberInput("9")} disabled={!buttonsEnabled.includes("9")} />
              <KeypadButton label="Remove" onclick={onRemove} disabled={frequency == "XXX.XXX"} color="preset-filled-warning-500" />
              <KeypadButton label="0" onclick={() => onNumberInput("0")} disabled={!buttonsEnabled.includes("0")} />
              <KeypadButton label="Enter" onclick={onEnter} disabled={!validFrequencies.includes(frequency)} color="preset-filled-accept-500" />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}

