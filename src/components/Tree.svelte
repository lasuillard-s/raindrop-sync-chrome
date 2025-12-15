<script lang="ts" generics="T extends NodeData">
	import { ChevronDownOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
	import type { NodeData, TreeNode } from '~/lib/sync/tree';

	export let treeNode: TreeNode<T>;
	export let collapsed: boolean = true;

	let isFolder: boolean;
	let href: string | null;
	let nodeTitle: string;
	let childCount: number;

	$: {
		isFolder = treeNode.isFolder();
		href = treeNode.getUrl();
		nodeTitle = treeNode.getName() || '';
		childCount = treeNode.children.length;
	}

	const toggleCollapse = () => {
		collapsed = !collapsed;
	};
</script>

<div class="leading-relaxed">
	{#if isFolder}
		<div class="inline-flex items-center gap-1.5">
			{#if treeNode.children.length > 0}
				<button
					type="button"
					onclick={toggleCollapse}
					class="inline-flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-gray-100"
				>
					{#if collapsed}
						<ChevronRightOutline class="h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
					{:else}
						<ChevronDownOutline class="h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
					{/if}
					<strong class="text-sm">📁 {nodeTitle}</strong>
					<span class="text-xs font-normal text-gray-500">({childCount})</span>
				</button>
			{:else}
				<span class="inline-flex items-center gap-1.5 px-1.5 py-0.5">
					<span class="h-3.5 w-3.5"></span>
					<strong class="text-sm">📁 {nodeTitle}</strong>
					<span class="text-xs font-normal text-gray-500">({childCount})</span>
				</span>
			{/if}
		</div>
	{:else}
		<div class="inline-flex items-center px-1.5 py-0.5">
			<span class="mr-1.5 h-3.5 w-3.5"></span>
			<a
				{href}
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
				>🔖 {nodeTitle}</a
			>
		</div>
	{/if}
	{#if treeNode.children.length > 0 && !collapsed}
		<div class="mt-0.5 ml-6">
			{#each treeNode.children as child (child.data?.getId() || Math.random())}
				<svelte:self treeNode={child} />
			{/each}
		</div>
	{/if}
</div>
