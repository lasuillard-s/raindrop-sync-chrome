<script lang="ts">
	import {
		Accordion,
		AccordionItem,
		Button,
		Heading,
		P,
		Radio,
		Spinner,
		Toggle
	} from 'flowbite-svelte';
	import {
		CheckCircleSolid,
		CircleMinusSolid,
		CirclePlusSolid,
		ExclamationCircleSolid
	} from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import PathBreadcrumb from '~/components/PathBreadcrumb.svelte';
	import Tree from '~/components/Tree.svelte';
	import { appSettings } from '~/config';
	import type { ChromeBookmarkNodeData } from '~/lib/browser/chrome';
	import { putMessage } from '~/lib/messages';
	import { RaindropNodeData } from '~/lib/raindrop';
	import type { SyncEvent, SyncEventListener, TreeNode } from '~/lib/sync';
	import syncManager, { SyncDiff } from '~/lib/sync';

	let latestSyncEvent: SyncEvent | null = $state(null);

	class SyncEventListenerImpl implements SyncEventListener {
		onEvent(event: SyncEvent) {
			latestSyncEvent = event;
		}
	}

	// Expected (from Raindrop.io)
	let expectedBookmarkTree: TreeNode<RaindropNodeData> | null = $state(null);
	let isFetchingRaindrops = $state(false);
	let syncLocationFullPath: string | null = $state(null);

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
	let currentBookmarkTree: TreeNode<ChromeBookmarkNodeData> | null = $state(null);
	let isFetchingChrome = $state(false);

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
	let syncDiff: SyncDiff<RaindropNodeData, ChromeBookmarkNodeData> | null = $state(null);
	let isCalculatingDiff = $state(false);

	// Force sync
	let isSyncing = $state(false);
	let forceSyncEnabled = $state(false);

	const calculateSyncDiff = async () => {
		if (!expectedBookmarkTree || !currentBookmarkTree) {
			return;
		}
		isCalculatingDiff = true;
		try {
			syncDiff = await syncManager.calculateSyncDiff(expectedBookmarkTree, currentBookmarkTree);
			console.debug('Calculated difference between current and expected tree: ', syncDiff);

			const getCircularReplacer = () => {
				const seen = new WeakSet();
				return (key: string, value: unknown) => {
					if (typeof value === 'object' && value !== null) {
						if (seen.has(value)) {
							return;
						}
						seen.add(value);
					}
					return value;
				};
			};
			console.debug(
				'Calculated difference between current and expected tree: ',
				JSON.stringify(syncDiff, getCircularReplacer())
			);
		} finally {
			isCalculatingDiff = false;
		}
	};

	// Sync settings
	let bookmarkFolders: { id: string; title: string; depth: number }[] = $state([]);

	// Create reactive bindings to stores
	let autoSyncEnabled = $state(get(appSettings.autoSyncEnabled));
	let autoSyncExecOnStartup = $state(get(appSettings.autoSyncExecOnStartup));
	let autoSyncIntervalInMinutes = $state(get(appSettings.autoSyncIntervalInMinutes));
	let syncLocation = $state(get(appSettings.syncLocation));
	let useLegacySyncMechanism = $state(get(appSettings.useLegacySyncMechanism));

	// Keep local state in sync with stores
	$effect(() => {
		const unsubscribe = appSettings.autoSyncEnabled.subscribe((value) => {
			autoSyncEnabled = value;
		});
		return unsubscribe;
	});
	$effect(() => {
		const unsubscribe = appSettings.autoSyncExecOnStartup.subscribe((value) => {
			autoSyncExecOnStartup = value;
		});
		return unsubscribe;
	});
	$effect(() => {
		const unsubscribe = appSettings.autoSyncIntervalInMinutes.subscribe((value) => {
			autoSyncIntervalInMinutes = value;
		});
		return unsubscribe;
	});
	$effect(() => {
		const unsubscribe = appSettings.syncLocation.subscribe((value) => {
			syncLocation = value;
		});
		return unsubscribe;
	});
	$effect(() => {
		const unsubscribe = appSettings.useLegacySyncMechanism.subscribe((value) => {
			useLegacySyncMechanism = value;
		});
		return unsubscribe;
	});

	const saveSettings = async () => {
		await appSettings.autoSyncEnabled.set(autoSyncEnabled);
		await appSettings.autoSyncExecOnStartup.set(autoSyncExecOnStartup);
		await appSettings.autoSyncIntervalInMinutes.set(autoSyncIntervalInMinutes);
		await appSettings.syncLocation.set(syncLocation);
		await appSettings.useLegacySyncMechanism.set(useLegacySyncMechanism);
		await syncManager.scheduleAutoSync();
		putMessage({ type: 'success', message: 'Sync settings saved.' });
	};

	const runSync = async () => {
		isSyncing = true;
		if (!currentBookmarkTree) {
			currentBookmarkTree = await syncManager.getCurrentBookmarkTree();
		}
		if (!expectedBookmarkTree) {
			expectedBookmarkTree = await syncManager.getExpectedBookmarkTree();
		}
		try {
			await fetchCurrentBookmarkTree();
			await fetchExpectedBookmarkTree();
			await calculateSyncDiff();
			await syncManager.startSync({
				precalculatedDiff: syncDiff!,
				force: forceSyncEnabled,
				useLegacy: useLegacySyncMechanism
			});
			putMessage({ type: 'success', message: 'Sync completed.' });
			// Refresh the bookmark trees after sync
		} catch (err) {
			putMessage({ type: 'error', message: `Sync failed: ${err}` });
		} finally {
			isSyncing = false;
		}
	};

	onMount(() => {
		const listener = new SyncEventListenerImpl();
		syncManager.addListener(listener);

		// Load bookmark folders for sync location selection
		// About async onMount handler: https://github.com/sveltejs/svelte/issues/4927
		(async () => {
			const bookmarksTree = (await chrome.bookmarks.getTree()) || [];
			if (!bookmarksTree[0]?.children) {
				putMessage({ type: 'error', message: 'No bookmark folders found.' });
				console.error('No bookmark folders found.');
				return;
			}

			const dfs = (arr: chrome.bookmarks.BookmarkTreeNode[], depth: number = 0) => {
				for (const node of arr) {
					if (depth != 0 /* Ignore virtual root */ && node.url === undefined) {
						bookmarkFolders.push({ id: node.id, title: node.title, depth });
					}
					if (node.children) {
						dfs(node.children ?? [], depth + 1);
					}
				}
			};

			dfs(bookmarksTree);

			// Force trigger reactivity
			bookmarkFolders = bookmarkFolders;
		})();

		return () => {
			syncManager.removeListener(listener);
		};
	});
</script>

<div>
	<!-- Sync Settings Section -->
	<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
		<div class="mb-6 border-b border-gray-200 pb-4">
			<Heading tag="h5" class="text-xl font-bold text-gray-900">Sync Settings</Heading>
			<P class="mt-2 text-sm text-gray-600">
				Configure automatic synchronization behavior and target location
			</P>
		</div>

		<div class="space-y-6">
			<!-- Auto Sync Options -->
			<div class="rounded-lg bg-gray-50 p-4">
				<P class="mb-3 text-sm font-semibold text-gray-700">Automatic Sync</P>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div>
							<P class="text-sm font-medium text-gray-900">Enable AutoSync</P>
							<P class="text-xs text-gray-500">Automatically sync bookmarks in background</P>
						</div>
						<Toggle bind:checked={autoSyncEnabled} />
					</div>
					<div class="flex items-center justify-between">
						<div>
							<P class="text-sm font-medium text-gray-900">Sync on Startup</P>
							<P class="text-xs text-gray-500">Run sync when browser starts</P>
						</div>
						<Toggle bind:checked={autoSyncExecOnStartup} />
					</div>
					<div class="flex items-center justify-between">
						<div>
							<P class="text-sm font-medium text-gray-900">Use Legacy Sync Mechanism</P>
							<P class="text-xs text-gray-500"
								>Use the old synchronization algorithm; clear all bookmarks in the target folder and
								recreate them based on Raindrop.io collections. This setting will be removed in a
								future release.
							</P>
						</div>
						<Toggle bind:checked={useLegacySyncMechanism} />
					</div>
				</div>
			</div>

			<!-- Sync Interval -->
			<div class="rounded-lg bg-gray-50 p-4">
				<P class="mb-3 text-sm font-semibold text-gray-700">Sync Interval</P>
				<input
					type="range"
					bind:value={autoSyncIntervalInMinutes}
					min="1"
					max="60"
					class="accent-primary-600 [&::-moz-range-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:bg-primary-600 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 focus:outline-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full"
				/>
				<div class="mt-2 flex items-center justify-between">
					<P class="text-xs text-gray-500">1 minute</P>
					<P class="text-sm font-medium text-gray-900">
						Every {autoSyncIntervalInMinutes}
						{autoSyncIntervalInMinutes === 1 ? 'minute' : 'minutes'}
					</P>
					<P class="text-xs text-gray-500">60 minutes</P>
				</div>
			</div>

			<!-- Sync Location -->
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="mb-3">
					<P class="text-sm font-semibold text-gray-700">Sync Location</P>
					<div class="mt-2 rounded-md border border-red-200 bg-red-50 p-3">
						<P class="text-xs font-medium text-red-700">
							⚠️ <b>Warning</b> Existing bookmarks in the selected folder might be removed or modified
							during sync!
						</P>
					</div>
				</div>
				<div class="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
					{#each bookmarkFolders as bf (bf.id)}
						<label
							class="flex cursor-pointer items-center border-b border-gray-100 px-3 py-2 transition-colors last:border-b-0 hover:bg-blue-50"
							class:bg-blue-50={syncLocation === bf.id}
							class:font-medium={syncLocation === bf.id}
						>
							<Radio name="sync-location" bind:group={syncLocation} value={bf.id} class="mr-2" />
							<span class="text-sm text-gray-700" style="margin-left: {bf.depth * 1.5}rem;">
								{#if bf.depth > 1}
									<span class="mr-1 text-gray-400">└─</span>
								{/if}
								{bf.title}
							</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Save Button -->
			<div class="flex justify-end border-t border-gray-200 pt-4">
				<Button onclick={saveSettings} class="px-6">Save Settings</Button>
			</div>
		</div>
	</div>

	<!-- Bookmark Trees Section -->
	<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
		<div class="rounded-lg border border-gray-200 bg-white p-4">
			<div class="mb-4 flex items-center justify-between">
				<P class="font-semibold text-gray-800">Raindrop.io Bookmarks</P>
				<Button size="xs" onclick={fetchExpectedBookmarkTree} disabled={isFetchingRaindrops}>
					{#if isFetchingRaindrops}
						<Spinner size="4" class="mr-1" />
					{/if}
					Fetch
				</Button>
			</div>
			{#if expectedBookmarkTree}
				<div class="min-h-75 overflow-y-auto">
					<Tree treeNode={expectedBookmarkTree} collapsed={false}></Tree>
				</div>
			{:else}
				<div class="flex min-h-75 items-center justify-center">
					<P class="text-gray-500 italic">Waiting for data...</P>
				</div>
			{/if}
		</div>
		<div class="rounded-lg border border-gray-200 bg-white p-4">
			<div class="mb-4 flex items-center justify-between">
				<P class="font-semibold text-gray-800">Chrome Bookmarks</P>
				<Button size="xs" onclick={fetchCurrentBookmarkTree} disabled={isFetchingChrome}>
					Reload
				</Button>
			</div>
			{#if currentBookmarkTree}
				<div class="min-h-75 overflow-y-auto">
					<Tree
						treeNode={currentBookmarkTree}
						collapsed={false}
						nodeTitleOverride={syncLocationFullPath}
					></Tree>
				</div>
			{:else}
				<div class="flex min-h-75 items-center justify-center">
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
								<div class="max-h-75 space-y-2 overflow-y-auto">
									{#each syncDiff.onlyInLeft as node (node.getId())}
										<PathBreadcrumb pathSegments={node.getFullPath().getSegments()} />
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
								<div class="max-h-75 space-y-2 overflow-y-auto">
									{#each syncDiff.onlyInRight as node (node.getId())}
										<PathBreadcrumb pathSegments={node.getFullPath().getSegments()} />
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
								<div class="max-h-75 space-y-2 overflow-y-auto">
									{#each syncDiff.inBothButDifferent as pair ((pair.left.getId(), pair.right.getId()))}
										<PathBreadcrumb pathSegments={pair.left.getFullPath().getSegments()} />
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
								<div class="max-h-75 space-y-2 overflow-y-auto">
									{#each syncDiff.unchanged as pair ((pair.left.getId(), pair.right.getId()))}
										<PathBreadcrumb pathSegments={pair.left.getFullPath().getSegments()} />
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
			<div class="flex min-h-30 items-center justify-center">
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

	<!-- Test It Section -->
	<div class="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm">
		<div class="mb-6 border-b border-blue-200 pb-4">
			<Heading tag="h5" class="text-xl font-bold text-blue-900">Test It</Heading>
			<P class="mt-2 text-sm text-blue-700">
				Trigger an immediate synchronization from Raindrop.io to Chrome with custom options
			</P>
		</div>

		<div class="space-y-4">
			<!-- Sync Options -->
			<div class="rounded-lg bg-white p-4">
				<P class="mb-3 text-sm font-semibold text-gray-700">Sync Options</P>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div>
							<P class="text-sm font-medium text-gray-900">Force Sync</P>
							<P class="text-xs text-gray-500">
								Bypass sync threshold and force synchronization immediately
							</P>
						</div>
						<Toggle bind:checked={forceSyncEnabled} />
					</div>
				</div>
			</div>

			<!-- Sync Button -->
			<div class="flex items-center justify-between gap-4">
				<div class="flex-1 rounded-md border border-blue-200 bg-white px-4 py-2">
					<P class="text-sm text-gray-700">
						{latestSyncEvent?.toMessage() || 'Sync status unavailable'}
					</P>
				</div>
				<Button color="blue" onclick={runSync} disabled={isSyncing} class="px-8 py-2">
					{#if isSyncing}
						<Spinner size="4" class="mr-2" />
						Syncing...
					{:else}
						🚀 Start Sync
					{/if}
				</Button>
			</div>
		</div>
	</div>
</div>
