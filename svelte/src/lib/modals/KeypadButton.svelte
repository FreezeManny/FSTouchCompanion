<script lang="ts">
	interface Props {
		label: string;
		disabled?: boolean;
		color?: string;
		onclick?: () => void;
	}

	let { label, disabled = false, color = "preset-filled", onclick }: Props = $props();
</script>

<div class="w-1/3 px-2 py-2">
	<button
		class="btn {color} w-full h-20 text-2xl"
		{onclick}
		{disabled}
	>
		{label}
	</button>
</div>
