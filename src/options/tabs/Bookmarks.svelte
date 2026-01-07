<script lang="ts">
	import { Accordion, AccordionItem, Button, P, Spinner } from 'flowbite-svelte';
	import {
		CheckCircleSolid,
		CircleMinusSolid,
		CirclePlusSolid,
		ExclamationCircleSolid
	} from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import PathBreadcrumb from '~/components/PathBreadcrumb.svelte';
	import Tree from '~/components/Tree.svelte';
	import type { ChromeBookmarkNodeData } from '~/lib/browser/chrome';
	import { putMessage } from '~/lib/messages';
	import { RaindropNodeData } from '~/lib/raindrop';
	import type { TreeNode } from '~/lib/sync';
	import syncManager, { SyncDiff } from '~/lib/sync';

	// Expected (from Raindrop.io)
	let expectedBookmarkTree: TreeNode<RaindropNodeData> | null = null;
	let isFetchingRaindrops = false;
	let syncLocationFullPath: string | null = null;

	const fetchExpectedBookmarkTree = async () => {
		isFetchingRaindrops = true;
		try {
			expectedBookmarkTree = await syncManager.getExpectedBookmarkTree();
		} catch (err) {
			putMessage({ type: 'error', message: `Failed to fetch Raindrop.io bookmarks: ${err}` });
		} finally {
			isFetchingRaindrops = false;
		}
	};

	// Current (Chrome bookmarks)
	let currentBookmarkTree: TreeNode<ChromeBookmarkNodeData> | null = null;
	let isFetchingChrome = false;

	const fetchCurrentBookmarkTree = async () => {
		isFetchingChrome = true;
		try {
			currentBookmarkTree = await syncManager.getCurrentBookmarkTree();
			syncLocationFullPath = currentBookmarkTree.getFullPathSegments().join(' / ') + ' /';
		} catch (err) {
			putMessage({ type: 'error', message: `Failed to fetch Chrome bookmarks: ${err}` });
		} finally {
			isFetchingChrome = false;
		}
	};

	// Diff
	let syncDiff: SyncDiff<RaindropNodeData, ChromeBookmarkNodeData> | null = null;
	let isCalculatingDiff = false;

	const calculateSyncDiff = async () => {
		if (!expectedBookmarkTree || !currentBookmarkTree) {
			return;
		}
		isCalculatingDiff = true;
		try {
			syncDiff = await syncManager.calculateSyncDiff({
				current: currentBookmarkTree,
				expected: expectedBookmarkTree
			});
			console.debug('Calculated difference between current and expected tree: ', syncDiff);
		} finally {
			isCalculatingDiff = false;
		}
	};

	onMount(async () => {
		// Fetch current tree at init because it's in-browser operation and cheap
		await fetchCurrentBookmarkTree();
	});
</script>

<div>
	<P class="text-gray-700">Configure and preview your synchronization settings.</P>
	<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
		<div class="rounded-lg border border-gray-200 bg-white p-4">
			<div class="mb-4 flex items-center justify-between">
				<P class="font-semibold text-gray-800">Raindrop.io Bookmarks</P>
				<Button
					size="xs"
					outline
					onclick={fetchExpectedBookmarkTree}
					disabled={isFetchingRaindrops}
				>
					{#if isFetchingRaindrops}
						<Spinner size="4" class="mr-1" />
					{/if}
					Fetch
				</Button>
			</div>
			{#if expectedBookmarkTree}
				<div class="min-h-[300px] overflow-y-auto">
					<Tree treeNode={expectedBookmarkTree} collapsed={false}></Tree>
				</div>
			{:else}
				<div class="flex min-h-[300px] items-center justify-center">
					<P class="text-gray-500 italic">Waiting for data...</P>
				</div>
			{/if}
		</div>
		<div class="rounded-lg border border-gray-200 bg-white p-4">
			<div class="mb-4 flex items-center justify-between">
				<P class="font-semibold text-gray-800">Chrome Bookmarks</P>
				<Button size="xs" outline onclick={fetchCurrentBookmarkTree} disabled={isFetchingChrome}>
					Reload
				</Button>
			</div>
			{#if currentBookmarkTree}
				<div class="min-h-[300px] overflow-y-auto">
					<!-- TODO: I want the chrome bookmark to show its full parent path as root; e.g.: /Bookmarks bar/child instead of / -->
					<Tree
						treeNode={currentBookmarkTree}
						collapsed={false}
						nodeTitleOverride={syncLocationFullPath}
					></Tree>
				</div>
			{:else}
				<div class="flex min-h-[300px] items-center justify-center">
					<P class="text-gray-500 italic">Waiting for data...</P>
				</div>
			{/if}
		</div>
	</div>

	<div class="mt-6 rounded-lg border border-gray-200 bg-white p-4">
		<div class="mb-4 flex items-center justify-between">
			<P class="font-semibold text-gray-800">Sync Differences</P>
			<Button
				size="xs"
				outline
				onclick={calculateSyncDiff}
				disabled={isCalculatingDiff || !expectedBookmarkTree || !currentBookmarkTree}
			>
				Calculate
			</Button>
		</div>
		{#if syncDiff}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<!-- Add (Only in Raindrop) -->
				<div class="rounded-lg border border-green-200 bg-green-50 p-3">
					<div class="mb-2 flex items-center gap-2">
						<CirclePlusSolid class="text-green-600" size="sm" />
						<P class="font-medium text-green-800">Add</P>
					</div>
					<P class="text-2xl font-bold text-green-600">{syncDiff.onlyInLeft.length}</P>
					<P class="mb-3 text-sm text-green-700">Items to be added</P>
					<Accordion>
						<AccordionItem>
							{#snippet header()}
								<div class="text-sm font-medium text-green-800">
									View details ({syncDiff!.onlyInLeft.length} items)
								</div>
							{/snippet}
							{#if syncDiff.onlyInLeft.length > 0}
								<div class="max-h-[300px] space-y-2 overflow-y-auto">
									{#each syncDiff.onlyInLeft as node (node.getId())}
										<PathBreadcrumb {node} />
									{/each}
								</div>
							{:else}
								<P class="text-sm text-gray-500 italic">No items to add</P>
							{/if}
						</AccordionItem>
					</Accordion>
				</div>

				<!-- Remove (Only in Chrome) -->
				<div class="rounded-lg border border-red-200 bg-red-50 p-3">
					<div class="mb-2 flex items-center gap-2">
						<CircleMinusSolid class="text-red-600" size="sm" />
						<P class="font-medium text-red-800">Remove</P>
					</div>
					<P class="text-2xl font-bold text-red-600">{syncDiff.onlyInRight.length}</P>
					<P class="mb-3 text-sm text-red-700">Items to be removed</P>
					<Accordion>
						<AccordionItem>
							{#snippet header()}
								<div class="text-sm font-medium text-red-800">
									View details ({syncDiff!.onlyInRight.length} items)
								</div>
							{/snippet}
							{#if syncDiff.onlyInRight.length > 0}
								<div class="max-h-[300px] space-y-2 overflow-y-auto">
									{#each syncDiff.onlyInRight as node (node.getId())}
										<PathBreadcrumb {node} />
									{/each}
								</div>
							{:else}
								<P class="text-sm text-gray-500 italic">No items to remove</P>
							{/if}
						</AccordionItem>
					</Accordion>
				</div>

				<!-- Update (Different) -->
				<div class="rounded-lg border border-orange-200 bg-orange-50 p-3">
					<div class="mb-2 flex items-center gap-2">
						<ExclamationCircleSolid class="text-orange-600" size="sm" />
						<P class="font-medium text-orange-800">Update</P>
					</div>
					<P class="text-2xl font-bold text-orange-600">{syncDiff.inBothButDifferent.length}</P>
					<P class="mb-3 text-sm text-orange-700">Items to be updated</P>
					<Accordion>
						<AccordionItem>
							{#snippet header()}
								<div class="text-sm font-medium text-orange-800">
									View details ({syncDiff!.inBothButDifferent.length} items)
								</div>
							{/snippet}
							{#if syncDiff.inBothButDifferent.length > 0}
								<div class="max-h-[300px] space-y-2 overflow-y-auto">
									{#each syncDiff.inBothButDifferent as pair ((pair.left.getId(), pair.right.getId()))}
										<PathBreadcrumb node={pair.left} />
									{/each}
								</div>
							{:else}
								<P class="text-sm text-gray-500 italic">No items to update</P>
							{/if}
						</AccordionItem>
					</Accordion>
				</div>

				<!-- No Change (Unchanged) -->
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
					<div class="mb-2 flex items-center gap-2">
						<CheckCircleSolid class="text-gray-600" size="sm" />
						<P class="font-medium text-gray-800">No Change</P>
					</div>
					<P class="text-2xl font-bold text-gray-600">{syncDiff.unchanged.length}</P>
					<P class="mb-3 text-sm text-gray-700">Items unchanged</P>
					<Accordion>
						<AccordionItem>
							{#snippet header()}
								<div class="text-sm font-medium text-gray-800">
									View details ({syncDiff!.unchanged.length} items)
								</div>
							{/snippet}
							{#if syncDiff.unchanged.length > 0}
								<div class="max-h-[300px] space-y-2 overflow-y-auto">
									{#each syncDiff.unchanged as pair ((pair.left.getId(), pair.right.getId()))}
										<PathBreadcrumb node={pair.left} />
									{/each}
								</div>
							{:else}
								<P class="text-sm text-gray-500 italic">No unchanged items</P>
							{/if}
						</AccordionItem>
					</Accordion>
				</div>
			</div>
		{:else}
			<div class="flex min-h-[120px] items-center justify-center">
				<P class="text-gray-500 italic">
					{#if !expectedBookmarkTree || !currentBookmarkTree}
						Please fetch both Raindrop.io and Chrome bookmarks first
					{:else}
						Click "Calculate" to see sync differences
					{/if}
				</P>
			</div>
		{/if}
	</div>
</div>
