<script lang="ts">
	import { App } from '$app';
	import Tree from '$components/Tree.svelte';
	import { putMessage } from '$lib/messages';
	import { SyncDiff, SyncDiffAnalyzer, SyncPlan, SyncPlanner } from '$lib/sync';
	import { ChromeAdapter, type ChromeBookmarkTreeNode } from '$lib/sync/providers/chrome';
	import { RaindropAdapter, type RaindropBookmarkTreeNode } from '$lib/sync/providers/raindrop';
	import { NeutralTreeNode } from '$lib/sync/tree';
	import type { SyncEvent, SyncEventListener } from '$services/sync';
	import { Button, Heading, P, Radio, Spinner, Toggle } from 'flowbite-svelte';
	import { ArrowDownOutline } from 'flowbite-svelte-icons';
	import SyncDiffSummary from '../components/SyncDiffSummary.svelte';

	const app = App.getInstance();
	const settings = app.settings;
	const settingsSnapshot = settings.snapshot;
	const sourceAdapter = new RaindropAdapter();
	const targetAdapter = new ChromeAdapter();
	const diffAnalyzer = new SyncDiffAnalyzer();
	const syncPlanner = new SyncPlanner();

	// Sync progress tracking
	let latestSyncEvent: SyncEvent | null = $state(null);

	class SyncEventListenerImpl implements SyncEventListener {
		onEvent(event: SyncEvent) {
			latestSyncEvent = event;
		}
	}

	// Data trees
	let sourceTree: RaindropBookmarkTreeNode | null = $state(null);
	let fetchingSourceTree: boolean = $state(false);
	let targetTree: ChromeBookmarkTreeNode | null = $state(null);
	let fetchingTargetTree: boolean = $state(false);
	let currentState: NeutralTreeNode | null = $state(null);
	let desiredState: NeutralTreeNode | null = $state(null);
	let diff: SyncDiff | null = $state(null);
	let plan: SyncPlan | null = $state(null);
	let isCalculatingStates = $state(false);
	let isPlanning = $state(false);

	// Force sync
	let isSyncing = $state(false);
	let forceSyncEnabled = $state(false);

	// Sync settings
	// --------------------------------------------------------------------------
	let bookmarkFolders: { id: string; title: string; depth: number }[] = $state([]);

	// Create reactive bindings to settings store
	let autoSyncEnabled = $state(settingsSnapshot.autoSyncEnabled);
	let autoSyncExecOnStartup = $state(settingsSnapshot.autoSyncExecOnStartup);
	let autoSyncIntervalInMinutes = $state(settingsSnapshot.autoSyncIntervalInMinutes);
	let syncLocationId = $state(settingsSnapshot.syncLocation);

	// Keep local state in sync with settings store
	$effect(() => {
		const unsubscribe = settings.$data.subscribe((settings) => {
			autoSyncEnabled = settings.autoSyncEnabled;
			autoSyncExecOnStartup = settings.autoSyncExecOnStartup;
			autoSyncIntervalInMinutes = settings.autoSyncIntervalInMinutes;
			syncLocationId = settings.syncLocation;
		});
		return unsubscribe;
	});

	// User actions
	// --------------------------------------------------------------------------
	// eslint-disable-next-line jsdoc/require-jsdoc
	async function makeSourceTree(options: { skipIfExists?: boolean } = { skipIfExists: false }) {
		if (options?.skipIfExists && sourceTree) {
			return;
		}
		try {
			fetchingSourceTree = true;
			sourceTree = await sourceAdapter.getTree();
		} finally {
			fetchingSourceTree = false;
		}
	}

	// eslint-disable-next-line jsdoc/require-jsdoc
	async function makeTargetTree(options: { skipIfExists?: boolean } = { skipIfExists: false }) {
		if (options?.skipIfExists && targetTree) {
			return;
		}
		try {
			fetchingTargetTree = true;
			targetTree = await targetAdapter.getTree();
		} finally {
			fetchingTargetTree = false;
		}
	}

	// eslint-disable-next-line jsdoc/require-jsdoc
	function calculateStates() {
		try {
			isCalculatingStates = true;
			if (!sourceTree || !targetTree) {
				throw new Error('Must fetch both source and target trees before constructing states.');
			}
			currentState = app.sync.buildCurrentState({ targetTree });
			desiredState = app.sync.buildDesiredState({
				targetTree,
				sourceTree,
				syncLocationId
			});
			diff = null;
			plan = null;
		} catch (err) {
			putMessage({ type: 'error', message: `Failed to calculate preview states: ${err}` });
		} finally {
			isCalculatingStates = false;
		}
	}

	// eslint-disable-next-line jsdoc/require-jsdoc
	function compareDiff() {
		if (!currentState || !desiredState) {
			throw new Error('Current and desired state must be calculated before comparing diff.');
		}
		diff = diffAnalyzer.compare(desiredState, currentState);
	}

	// eslint-disable-next-line jsdoc/require-jsdoc
	function generatePlan() {
		if (!diff) {
			throw new Error('Sync diff must be calculated before generating plan.');
		}
		plan = syncPlanner.generatePlan(diff);
	}

	/**
	 * Build the sync plan preview from the current and desired tree states.
	 */
	function buildPlanPreview() {
		isPlanning = true;
		try {
			compareDiff();
			generatePlan();
		} catch (err) {
			putMessage({ type: 'error', message: `Failed to build sync plan: ${err}` });
		} finally {
			isPlanning = false;
		}
	}

	const runSync = async () => {
		isSyncing = true;
		try {
			await makeSourceTree({ skipIfExists: true });
			await makeTargetTree({ skipIfExists: true });
			calculateStates();
			compareDiff();
			generatePlan();
			await app.sync.runFullSync(
				{
					plan: plan!
				},
				{
					force: forceSyncEnabled
				}
			);
			putMessage({ type: 'success', message: 'Sync completed.' });
			// Refresh the bookmark trees after sync
		} catch (err) {
			putMessage({ type: 'error', message: `Sync failed: ${err}` });
		} finally {
			isSyncing = false;
		}
	};

	const saveSettings = async () => {
		await settings.update({
			autoSyncEnabled,
			autoSyncExecOnStartup,
			autoSyncIntervalInMinutes,
			syncLocation: syncLocationId
		});
		await app.sync.scheduleAutoSync();
		putMessage({ type: 'success', message: 'Sync settings saved.' });
	};

	$effect(() => {
		const listener = new SyncEventListenerImpl();
		app.sync.addEventListener(listener);

		void (async () => {
			// Load bookmark folders for sync location selection.
			await settings.init();
			const bookmarksTree = (await browser.bookmarks.getTree()) || [];
			if (!bookmarksTree[0]?.children) {
				putMessage({ type: 'error', message: 'No bookmark folders found.' });
				console.error('No bookmark folders found.');
				return;
			}

			const folders: { id: string; title: string; depth: number }[] = [];
			const dfs = (arr: browser.bookmarks.BookmarkTreeNode[], depth: number = 0) => {
				for (const node of arr) {
					if (depth != 0 /* Ignore virtual root */ && node.url === undefined) {
						folders.push({ id: node.id, title: node.title, depth });
					}
					if (node.children) {
						dfs(node.children ?? [], depth + 1);
					}
				}
			};

			dfs(bookmarksTree);
			bookmarkFolders = folders;
		})();

		return () => {
			app.sync.removeEventListener(listener);
		};
	});
</script>

<div>
	<div class="rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm">
		<div class="flex items-start gap-3">
			<span class="text-xl leading-none">⚠️</span>
			<div class="space-y-1">
				<P class="font-semibold text-amber-900">Back up your bookmarks before syncing</P>
				<P class="text-sm text-amber-800">
					Back up your Chrome bookmarks before syncing. This extension is still early in
					development, unstable, and may make breaking bookmark changes at any time.
				</P>
			</div>
		</div>
	</div>

	<!-- Sync Settings Section -->
	<div class="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
							⚠️ <b>Warning:</b> Existing bookmarks in the selected folder might be removed or modified
							during sync. Back up your Chrome bookmarks before syncing. This extension is still early
							in development, unstable, and may make breaking bookmark changes at any time.
						</P>
					</div>
				</div>
				<div class="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
					{#each bookmarkFolders as bf (bf.id)}
						<label
							class="flex cursor-pointer items-center border-b border-gray-100 px-3 py-2 transition-colors last:border-b-0 hover:bg-blue-50"
							class:bg-blue-50={syncLocationId === bf.id}
							class:font-medium={syncLocationId === bf.id}
						>
							<Radio name="sync-location" bind:group={syncLocationId} value={bf.id} class="mr-2" />
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
	<div class="mt-6 rounded-lg border border-gray-200 bg-white p-4">
		<div class="mb-4">
			<P class="font-semibold text-gray-800">1. Source vs Target Trees</P>
			<P class="mt-1 text-sm text-gray-600">
				Compare the live Raindrop source with the current Chrome bookmark target before building the
				sync preview.
			</P>
		</div>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<P class="font-semibold text-gray-800">Raindrop.io Bookmarks</P>
						<P class="mt-1 text-xs text-gray-500">Remote source tree</P>
					</div>
					<Button
						size="xs"
						onclick={async () => {
							await makeSourceTree();
						}}
						disabled={fetchingSourceTree}
					>
						{#if fetchingSourceTree}
							<Spinner size="4" class="mr-1" />
						{/if}
						Fetch
					</Button>
				</div>
				{#if sourceTree}
					<div class="min-h-75 overflow-y-auto rounded-md border border-gray-200 bg-white p-3">
						<Tree treeNode={sourceTree} collapsed={false}></Tree>
					</div>
				{:else}
					<div
						class="flex min-h-75 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white p-3"
					>
						<P class="text-gray-500 italic">Waiting for data...</P>
					</div>
				{/if}
			</div>
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<P class="font-semibold text-gray-800">Chrome Bookmarks</P>
						<P class="mt-1 text-xs text-gray-500">Current sync target tree</P>
					</div>
					<Button
						size="xs"
						onclick={async () => {
							await makeTargetTree();
						}}
						disabled={fetchingTargetTree}
					>
						Refresh
					</Button>
				</div>
				{#if targetTree}
					<div class="min-h-75 overflow-y-auto rounded-md border border-gray-200 bg-white p-3">
						<Tree treeNode={targetTree} collapsed={false}></Tree>
					</div>
				{:else}
					<div
						class="flex min-h-75 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white p-3"
					>
						<P class="text-gray-500 italic">Waiting for data...</P>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="my-4 flex justify-center" aria-hidden="true">
		<div
			class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"
		>
			<ArrowDownOutline class="h-6 w-6" />
		</div>
	</div>

	<div class="mt-6 rounded-lg border border-gray-200 bg-white p-4">
		<div class="mb-4 flex items-center justify-between gap-4">
			<div>
				<P class="font-semibold text-gray-800">2. Current vs Desired State</P>
				<P class="mt-1 text-sm text-gray-600">
					Review the current Chrome bookmark tree and the desired post-sync tree before planning
					changes.
				</P>
			</div>
			<Button
				size="xs"
				onclick={calculateStates}
				disabled={isCalculatingStates || !sourceTree || !targetTree || !syncLocationId}
			>
				{#if isCalculatingStates}
					<Spinner size="4" class="mr-1" />
				{/if}
				Calculate
			</Button>
		</div>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<P class="font-semibold text-gray-800">Current State</P>
						<P class="mt-1 text-xs text-gray-500">As-is in Chrome</P>
					</div>
				</div>
				{#if currentState}
					<div class="min-h-75 overflow-y-auto rounded-md border border-gray-200 bg-white p-3">
						<Tree treeNode={currentState} nodeTitleOverride="Current State" collapsed={false}
						></Tree>
					</div>
				{:else}
					<div
						class="flex min-h-75 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white p-3"
					>
						<P class="text-gray-500 italic">
							{#if !sourceTree || !targetTree}
								Fetch both source and target trees to preview state.
							{:else}
								Click "Calculate" to preview state.
							{/if}
						</P>
					</div>
				{/if}
			</div>
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
				<div class="mb-4 flex items-center justify-between">
					<div>
						<P class="font-semibold text-gray-800">Desired State</P>
						<P class="mt-1 text-xs text-gray-500">After sync completes</P>
					</div>
				</div>
				{#if desiredState}
					<div class="min-h-75 overflow-y-auto rounded-md border border-gray-200 bg-white p-3">
						<Tree treeNode={desiredState} nodeTitleOverride="Desired State" collapsed={false}
						></Tree>
					</div>
				{:else}
					<div
						class="flex min-h-75 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white p-3"
					>
						<P class="text-gray-500 italic">
							{#if !sourceTree || !targetTree}
								Fetch both source and target trees to preview state.
							{:else}
								Click "Calculate" to preview state.
							{/if}
						</P>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="my-4 flex justify-center" aria-hidden="true">
		<div
			class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"
		>
			<ArrowDownOutline class="h-6 w-6" />
		</div>
	</div>

	<div class="mt-6 rounded-lg border border-gray-200 bg-white p-4">
		<div class="mb-4 flex items-center justify-between">
			<div>
				<P class="font-semibold text-gray-800">3. Plan</P>
				<P class="mt-1 text-sm text-gray-600">Build the sync plan before applying changes.</P>
			</div>
			<Button
				size="xs"
				onclick={buildPlanPreview}
				disabled={isPlanning || !currentState || !desiredState}
			>
				{#if isPlanning}
					<Spinner size="4" class="mr-1" />
				{/if}
				Plan
			</Button>
		</div>
		{#if diff}
			<SyncDiffSummary {diff} />
		{:else}
			<div class="flex min-h-30 items-center justify-center">
				<P class="text-gray-500 italic">
					{#if !sourceTree || !targetTree}
						Please fetch both Raindrop.io and Chrome bookmarks first
					{:else if !currentState || !desiredState}
						Click "Calculate" to preview current and desired state first
					{:else}
						Click "Plan" to see planned changes
					{/if}
				</P>
			</div>
		{/if}
	</div>

	<div class="my-4 flex justify-center" aria-hidden="true">
		<div
			class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"
		>
			<ArrowDownOutline class="h-6 w-6" />
		</div>
	</div>

	<div class="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm">
		<div class="mb-6 border-b border-blue-200 pb-4">
			<Heading tag="h5" class="text-xl font-bold text-blue-900">4. Apply</Heading>
			<P class="mt-2 text-sm text-blue-700">
				Apply the planned synchronization from Raindrop.io to Chrome with custom options
			</P>
		</div>

		<div class="space-y-4">
			<div class="rounded-lg border border-amber-200 bg-white p-4">
				<P class="text-sm font-semibold text-amber-900">Safety reminder</P>
				<P class="mt-1 text-sm text-amber-800">
					Back up your Chrome bookmarks before syncing. This extension is still early in
					development, unstable, and may make breaking bookmark changes at any time.
				</P>
			</div>

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
						{latestSyncEvent?.toMessage() ||
							(plan ? 'Ready to apply the planned changes.' : 'Build a plan to enable apply.')}
					</P>
				</div>
				<Button color="blue" onclick={runSync} disabled={isSyncing || !plan} class="px-8 py-2">
					{#if isSyncing}
						<Spinner size="4" class="mr-2" />
						Syncing...
					{:else}
						🚀 Apply Sync
					{/if}
				</Button>
			</div>
		</div>
	</div>
</div>
