<script lang="ts">
  import { onMount } from "svelte";

  let { title = "Radio Keypad", onSubmit }: { title?: string; onSubmit?: (value: number) => void } = $props();

  let dialogElement: HTMLDialogElement;
  let frequency = $state<string>("XXX.XXX");
  let buttonsEnabled = $state<string>("1");
  let validFrequencies = $state<string[]>([""]);

  onMount(() => {
    validFrequencies = generateValidFrequencies();
    buttonsEnabled = getPossibleNumbers(frequency, validFrequencies);
  });

  export function show() {
    frequency = "XXX.XXX";
    buttonsEnabled = getPossibleNumbers(frequency, validFrequencies);
    dialogElement?.showModal();
  }

  export function close() {
    dialogElement?.close();
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
    buttonsEnabled = getPossibleNumbers(frequency, validFrequencies);
  }

  function onRemove(): void {
    console.log("Remove");
    removeLastDigit();
    buttonsEnabled = getPossibleNumbers(frequency, validFrequencies);
  }

  function onEnter(): void {
    onSubmit?.(removeDecimal(frequency));
    close();
  }

  function onCancel(): void {
    close();
  }
</script>

<dialog
  bind:this={dialogElement}
  class="rounded-container-token bg-surface-100-900 text-inherit max-w-[640px] p-0 space-y-0 z-10 backdrop:bg-surface-50/75 dark:backdrop:bg-surface-950/75"
>
  <div class="container mx-small p-8 space-y-8 preset-filled-surface-500 rounded-sm w-auto">
    <div class="flex justify-between items-center">
      <h1 class="h1">{title}</h1>
      <button type="button" class="btn-icon preset-tonal" onclick={onCancel} aria-label="Close">✕</button>
    </div>

    <div class="container preset-filled mx-auto p-8 space-y-8 text-center bg-gray-800 text-white rounded-sm">
      <h1 class="h1">{frequency}</h1>
    </div>

    <div class="flex flex-wrap rounded-xl max-w-sm mx-auto mt-24">
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled w-full h-20 text-2xl" onclick={() => onNumberInput("1")} disabled={!buttonsEnabled.includes("1")}>
          1
        </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled w-full h-20 text-2xl" onclick={() => onNumberInput("2")} disabled={!buttonsEnabled.includes("2")}>
          2
        </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled w-full h-20 text-2xl" onclick={() => onNumberInput("3")} disabled={!buttonsEnabled.includes("3")}>
          3
        </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled w-full h-20 text-2xl" onclick={() => onNumberInput("4")} disabled={!buttonsEnabled.includes("4")}>
          4
        </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled w-full h-20 text-2xl" onclick={() => onNumberInput("5")} disabled={!buttonsEnabled.includes("5")}>
          5
        </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled w-full h-20 text-2xl" onclick={() => onNumberInput("6")} disabled={!buttonsEnabled.includes("6")}>
          6
        </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled w-full h-20 text-2xl" onclick={() => onNumberInput("7")} disabled={!buttonsEnabled.includes("7")}>
          7
        </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled w-full h-20 text-2xl" onclick={() => onNumberInput("8")} disabled={!buttonsEnabled.includes("8")}>
          8
        </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled w-full h-20 text-2xl" onclick={() => onNumberInput("9")} disabled={!buttonsEnabled.includes("9")}>
          9
        </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled-error-500 w-full h-20 text-2xl" onclick={() => onRemove()} disabled={frequency == "XXX.XXX"}> Remove </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled w-full h-20 text-2xl" onclick={() => onNumberInput("0")} disabled={!buttonsEnabled.includes("0")}>
          0
        </button>
      </div>
      <div class="w-1/3 px-2 py-2">
        <button class="btn preset-filled-success-500 w-full h-20 text-2xl" onclick={() => onEnter()} disabled={!validFrequencies.includes(frequency)}>
          Enter
        </button>
      </div>
    </div>
  </div>
</dialog>

<style>
  dialog,
  dialog::backdrop {
    --anim-duration: 250ms;
    transition:
      display var(--anim-duration) allow-discrete,
      overlay var(--anim-duration) allow-discrete,
      opacity var(--anim-duration);
    opacity: 0;
  }
  /* Animate In */
  dialog[open],
  dialog[open]::backdrop {
    opacity: 1;
  }
  /* Animate Out */
  @starting-style {
    dialog[open],
    dialog[open]::backdrop {
      opacity: 0;
    }
  }
</style>
