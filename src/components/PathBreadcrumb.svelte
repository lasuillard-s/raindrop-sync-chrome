<script lang="ts">
	interface Props {
		pathSegments: string[];
	}
	let { pathSegments }: Props = $props();
</script>

<div class="rounded bg-white p-2">
	<div class="flex items-center gap-1 text-xs text-gray-500">
		<span>/</span>
		{#each pathSegments as segment, index (index)}
			{#if index > 0}
				<span>/</span>
			{/if}
			<span
				class={index === pathSegments.length - 1 ? 'font-medium text-gray-900' : ''}
				data-testid={'path-segment-' + index}
			>
				{segment}
			</span>
		{/each}
	</div>
</div>
