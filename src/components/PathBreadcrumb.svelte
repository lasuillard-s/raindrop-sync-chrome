<script lang="ts">
	import { onMount } from 'svelte';
	import type { NodeData, TreeNode } from '~/lib/sync';

	interface Props {
		node: TreeNode<NodeData>;
	}

	let { node }: Props = $props();
	let pathSegments: string[] = $state([]);

	onMount(() => {
		pathSegments = node.getFullPath().getSegments();
	});
</script>

<div class="rounded bg-white p-2">
	<div class="flex items-center gap-1 text-xs text-gray-500">
		<span>/</span>
		{#each pathSegments as segment, index (index)}
			{#if index > 0}
				<span>/</span>
			{/if}
			<span class={index === pathSegments.length - 1 ? 'font-medium text-gray-900' : ''}>
				{segment}
			</span>
		{/each}
	</div>
</div>
