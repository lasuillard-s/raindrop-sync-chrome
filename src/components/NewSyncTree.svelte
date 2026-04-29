<script lang="ts">
	import { ChevronDownOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
	import type { TreeNode } from '~/lib/sync';
	import { isUrlSafeHref } from '~/lib/util/string';
	import Self from './NewSyncTree.svelte';

	interface Props {
		treeNode: TreeNode;
		collapsed?: boolean;
		/** Special property for overriding defaults for all children components. */
		propagatingDefaults?: {
			collapsed?: boolean;
		};
	}
	let { treeNode, collapsed = $bindable(), propagatingDefaults }: Props = $props();

	const isFolder: boolean = $derived(treeNode.isFolder());
	const href: string | null = $derived(treeNode.url);
	const nodeTitle: string = $derived(treeNode.title || '');
	const childCount: number = $derived(treeNode.children?.length ?? 0);
	const pathString: string = $derived(treeNode.getPath().toString());

	const toggleCollapse = () => {
		collapsed = !collapsed;
	};

	$effect(() => {
		if (collapsed === undefined) {
			collapsed = propagatingDefaults?.collapsed ?? true;
		}
	});
</script>

<div class="leading-relaxed" data-testid={pathString}>
	{#if isFolder}
		<div class="inline-flex items-center gap-1.5">
			{#if treeNode.children && treeNode.children.length > 0}
				<button
					type="button"
					onclick={toggleCollapse}
					class="inline-flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-gray-100"
				>
					{#if collapsed}
						<ChevronRightOutline class="h-3.5 w-3.5 shrink-0 text-gray-600" />
					{:else}
						<ChevronDownOutline class="h-3.5 w-3.5 shrink-0 text-gray-600" />
					{/if}
					<strong class="text-sm font-semibold text-gray-800">📁 {nodeTitle}</strong>
					<span class="text-xs font-normal text-gray-500">({childCount})</span>
				</button>
			{:else}
				<span class="inline-flex items-center gap-1.5 px-1.5 py-0.5">
					<span class="h-3.5 w-3.5"></span>
					<strong class="text-sm font-semibold text-gray-800">📁 {nodeTitle}</strong>
					<span class="text-xs font-normal text-gray-500">({childCount})</span>
				</span>
			{/if}
		</div>
	{:else}
		<div class="inline-flex items-center px-1.5 py-0.5">
			<span class="mr-1.5 h-3.5 w-3.5"></span>
			<a
				href={href && isUrlSafeHref(href) ? href : undefined}
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline"
				>🔖 {nodeTitle}</a
			>
		</div>
	{/if}
	{#if treeNode.children && treeNode.children.length > 0 && !collapsed}
		<div class="mt-0.5 ml-6">
			{#each treeNode.children as child (child.id)}
				<Self treeNode={child} {propagatingDefaults} />
			{/each}
		</div>
	{/if}
</div>
