<script lang="ts">
	interface Props {
		label: string;
		disabled?: boolean;
		color?: string;
		onclick?: () => void;
	}

	let { label, disabled = false, color = "preset-filled-primary-500", onclick }: Props = $props();
</script>

<div class="p-1">
	<button
		class="btn {color} w-full h-20 text-2xl"
		{onclick}
		{disabled}
	>
		{label}
	</button>
</div>
