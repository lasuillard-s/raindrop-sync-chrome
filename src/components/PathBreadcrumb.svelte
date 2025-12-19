<script lang="ts">
	import type { NodeData, TreeNode } from '~/lib/sync';

	interface Props {
		node: TreeNode<NodeData>;
	}

	let { node }: Props = $props();
</script>

<div class="rounded bg-white p-2">
	<div class="flex items-center gap-1 text-xs text-gray-500">
		<span>/</span>
		{#each node.getFullPathSegments() as segment, index (index)}
			{#if index > 0}
				<span>/</span>
			{/if}
			<span
				class={index === node.getFullPathSegments().length - 1 ? 'font-medium text-gray-900' : ''}
			>
				{segment}
			</span>
		{/each}
	</div>
</div>
