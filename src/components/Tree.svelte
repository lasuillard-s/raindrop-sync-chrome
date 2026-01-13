<script lang="ts" generics="T extends NodeData">
	import { ChevronDownOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
	import type { NodeData, TreeNode } from '~/lib/sync';
	import Self from './Tree.svelte';

	interface Props {
		treeNode: TreeNode<T>;
		collapsed?: boolean;
		/** Override for title -- root-only. */
		nodeTitleOverride?: string | null;
		/** Special property for overriding defaults for all children components. */
		propagatingDefaults?: {
			collapsed?: boolean;
		};
	}
	let { treeNode, collapsed, nodeTitleOverride = null, propagatingDefaults }: Props = $props();
	collapsed = collapsed ?? propagatingDefaults?.collapsed ?? true;

	const isFolder: boolean = $derived(treeNode.isFolder());
	const href: string | null = $derived(treeNode.getUrl());
	const nodeTitle: string = $derived(nodeTitleOverride || treeNode.getName() || '');
	const childCount: number = $derived(treeNode.children.length);
	const pathString: string = $derived(treeNode.getFullPath().toString());

	const toggleCollapse = () => {
		collapsed = !collapsed;
	};
</script>

<div class="leading-relaxed" data-testid={pathString}>
	{#if isFolder}
		<div class="inline-flex items-center gap-1.5">
			{#if treeNode.children.length > 0}
				<button
					type="button"
					onclick={toggleCollapse}
					class="inline-flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-gray-100"
					data-testid={`${pathString}::toggle`}
				>
					{#if collapsed}
						<ChevronRightOutline class="h-3.5 w-3.5 shrink-0 text-gray-600" />
					{:else}
						<ChevronDownOutline class="h-3.5 w-3.5 shrink-0 text-gray-600" />
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
				data-testid={`${pathString}::link`}>🔖 {nodeTitle}</a
			>
		</div>
	{/if}
	{#if treeNode.children.length > 0 && !collapsed}
		<div class="mt-0.5 ml-6">
			{#each treeNode.children as child (child.data?.getId() || Math.random())}
				<Self treeNode={child} {propagatingDefaults} />
			{/each}
		</div>
	{/if}
</div>
