<script lang="js">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	const modalStore = getModalStore();

	export let parent; // Keep this as is to allow it to be passed as a prop
	$: parentValue = parent;

	let frequency = 'XXX.XXX';
	let buttonsEnabled = '1';
	let validFrequencies = [''];

	onMount(() => {
		validFrequencies = generateValidFrequencies();
		buttonsEnabled = getPossibleNumbers(frequency, validFrequencies);
	});

	function generateValidFrequencies() {
		const startFrequency = 117.975;
		const endFrequency = 137.0;
		const step = 0.005;
		const excludedPatterns = ['20', '45', '70', '95'];

		let frequencies = [];

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

	function getPossibleNumbers(frequency, validFrequencies) {
		// Get the index of the first 'X'
		const index = frequency.indexOf('X');

		// If there's no 'X', return an empty string
		if (index === -1) {
			return '';
		}

		// Create a base frequency string from the current frequency
		const baseFrequency = frequency.substring(0, index);

		// Create a list to hold possible digits
		let possibleDigits = '';

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

	function addDigit(digit) {
		// Find the index of the first 'X'
		const index = frequency.indexOf('X');

		if (index !== -1) {
			// Replace the first 'X' with the entered digit
			frequency = frequency.substring(0, index) + digit + frequency.substring(index + 1);
		}
	}

	function removeLastDigit() {
		// Start from the last character and move backwards
		let index = frequency.length - 1;

		// Move index back until we find a non-'X' character that is not '.'
		while (index >= 0 && (frequency[index] === 'X' || frequency[index] === '.')) {
			index--;
		}

		// Replace the last digit with 'X' if found
		if (index >= 0) {
			frequency = frequency.substring(0, index) + 'X' + frequency.substring(index + 1);
		}
	}
	//--------------------------------------------------
	//Button Handler

	// Handle button clicks and log the value
	function onNumberInput(value) {
		//console.log(value);
		addDigit(value);
		buttonsEnabled = getPossibleNumbers(frequency, validFrequencies);
	}

	function onRemove() {
		console.log('Remove');
		removeLastDigit();
		buttonsEnabled = getPossibleNumbers(frequency, validFrequencies);
	}

	function onEnter() {
		$modalStore[0].response?.(frequency);
		modalStore.close();
	}
</script>

<div class="container mx-small p-8 space-y-8 variant-filled-surface rounded w-auto">
	<h1 class="h1">{$modalStore[0]?.title}</h1>

	<div class="container variant-filled mx-auto p-8 space-y-8 text-center bg-gray-800 text-white rounded">
		<h1 class="h1">{frequency}</h1>
	</div>

	<div class="flex flex-wrap rounded-xl max-w-sm mx-auto mt-24">
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled w-full h-20 text-2xl" on:click={() => onNumberInput('1')} disabled={!buttonsEnabled.includes('1')}>
				1
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled w-full h-20 text-2xl" on:click={() => onNumberInput('2')} disabled={!buttonsEnabled.includes('2')}>
				2
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled w-full h-20 text-2xl" on:click={() => onNumberInput('3')} disabled={!buttonsEnabled.includes('3')}>
				3
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled w-full h-20 text-2xl" on:click={() => onNumberInput('4')} disabled={!buttonsEnabled.includes('4')}>
				4
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled w-full h-20 text-2xl" on:click={() => onNumberInput('5')} disabled={!buttonsEnabled.includes('5')}>
				5
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled w-full h-20 text-2xl" on:click={() => onNumberInput('6')} disabled={!buttonsEnabled.includes('6')}>
				6
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled w-full h-20 text-2xl" on:click={() => onNumberInput('7')} disabled={!buttonsEnabled.includes('7')}>
				7
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled w-full h-20 text-2xl" on:click={() => onNumberInput('8')} disabled={!buttonsEnabled.includes('8')}>
				8
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled w-full h-20 text-2xl" on:click={() => onNumberInput('9')} disabled={!buttonsEnabled.includes('9')}>
				9
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled-error w-full h-20 text-2xl" on:click={() => onRemove()} disabled={frequency == 'XXX.XXX'}>
				Remove
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button class="btn variant-filled w-full h-20 text-2xl" on:click={() => onNumberInput('0')} disabled={!buttonsEnabled.includes('0')}>
				0
			</button>
		</div>
		<div class="w-1/3 px-2 py-2">
			<button
				class="btn variant-filled-success w-full h-20 text-2xl"
				on:click={() => onEnter()}
				disabled={!validFrequencies.includes(frequency)}
			>
				Enter
			</button>
		</div>
	</div>
</div>
