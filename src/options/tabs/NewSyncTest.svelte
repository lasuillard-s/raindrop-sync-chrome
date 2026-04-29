<script lang="ts">
	import { Badge, Button, Card, Heading, P, Spinner } from 'flowbite-svelte';
	import { PlayOutline, RefreshOutline, SearchOutline } from 'flowbite-svelte-icons';
	import { App } from '~/app';
	import NewSyncTree from '~/components/NewSyncTree.svelte';
	import { SyncDiffAnalyzer, SyncExecutor, SyncPlan, SyncPlanner, TreeNode } from '~/lib/sync';
	import { ChromeAdapter, ChromeBookmarkRepository } from '~/lib/sync/providers/chrome';
	import { RaindropAdapter } from '~/lib/sync/providers/raindrop';
	import { normalizeUrl } from '~/lib/util/string';

	const app = App.getInstance();

	let loading = $state(false);
	let log: string[] = $state([]);

	let sourceTree: TreeNode | null = $state(null);
	let targetTree: TreeNode | null = $state(null);
	let desiredTree: TreeNode | null = $state(null);
	let currentPlan: SyncPlan | null = $state(null);

	class DesiredTreeNode extends TreeNode {
		getHash(): string {
			if (this.isFolder()) {
				return this.getPath().toString();
			}
			return this.getPath().toString() + '|' + normalizeUrl(this.url || '');
		}
	}

	/**
	 * Deep clone a tree into desired-state nodes to avoid mutating source/target trees.
	 * @param node Tree node to clone.
	 * @returns Cloned tree node.
	 */
	function cloneTree(node: TreeNode): DesiredTreeNode {
		const clonedNode = new DesiredTreeNode({
			id: node.id,
			parent: null,
			title: node.title,
			type: node.type,
			url: node.url,
			raw: null
		});

		for (const child of node.children || []) {
			clonedNode.addChild(cloneTree(child));
		}

		return clonedNode;
	}

	/**
	 * Find a node by ID with depth-first traversal.
	 * @param root Root node where search starts.
	 * @param nodeId Node ID to find.
	 * @returns Matched node or null when no node has the requested ID.
	 */
	function findNodeById(root: TreeNode, nodeId: string): TreeNode | null {
		if (root.id === nodeId) {
			return root;
		}

		for (const child of root.children || []) {
			const result = findNodeById(child, nodeId);
			if (result) {
				return result;
			}
		}

		return null;
	}

	/**
	 * Resolve a descendant node by title-based segments.
	 * Accepts both root-relative and absolute paths that include ancestors of root.
	 * @param root Root node where search starts.
	 * @param segments Path segments to traverse.
	 * @returns Matched node or null if a segment is missing.
	 */
	function findNodeBySegments(root: TreeNode, segments: string[]): TreeNode | null {
		const normalizedSegments = segments.filter((segment) => segment.length > 0);

		let segmentsToTraverse = normalizedSegments;
		const rootIndex = normalizedSegments.indexOf(root.title);
		if (rootIndex >= 0) {
			segmentsToTraverse = normalizedSegments.slice(rootIndex + 1);
		}

		let current: TreeNode = root;
		for (const segment of segmentsToTraverse) {
			if (!current.isFolder()) {
				return null;
			}

			const next = current.children?.find((child) => child.title === segment) ?? null;
			if (!next) {
				return null;
			}

			current = next;
		}

		return current;
	}

	/**
	 * Add a timestamped message to the debug log.
	 * @param msg Log message.
	 * @param args Additional values to print under the message.
	 */
	function addLog(msg: string, ...args: any[]) {
		console.log(msg, ...args);
		log = [...log, `[${new Date().toLocaleTimeString()}] ${msg}`, ...args.map((a) => `  - ${a}`)];
	}

	/**
	 *
	 */
	async function runFetch() {
		loading = true;
		addLog('Fetching trees from Raindrop and Chrome...');
		desiredTree = null;
		currentPlan = null;
		try {
			const raindropAdapter = new RaindropAdapter();
			const chromeAdapter = new ChromeAdapter();

			const [sTree, tTree] = await Promise.all([
				raindropAdapter.getTree(),
				chromeAdapter.getTree()
			]);

			sourceTree = sTree;
			targetTree = tTree;

			addLog('Trees fetched and built successfully');
		} catch (e: any) {
			addLog(`Error: ${e.message}`);
			console.error(e);
		} finally {
			loading = false;
		}
	}

	/**
	 * Build desired state by replacing the sync-folder subtree in target with source content.
	 * @returns Desired tree when successful.
	 */
	async function makeDesiredState() {
		if (!sourceTree || !targetTree) {
			addLog('Error: Source/Target tree not loaded');
			return;
		}

		// Current sync logic should be equal to:
		// /** SyncStrategy fetches subtree using source adapter */
		// abstract class SyncStrategy {
		//   getTree(source: ReadableAdapter)
		// }
		// /** Simple path fetch strategy */
		// class SyncStrategyFullSync extends SyncStrategy {
		// 	constructor(id: string /* folder id from source  */) {
		// 		super();
		// 	}
		// }
		// /** Query to source adapter and get the result tree */
		// class SyncStrategyQuery extends SyncStrategy {
		//   constructor(query: string) {
		//     super();
		//   }
		// }
		// const recipe: [Path, SyncStrategy][] = [
		// 	{path: syncFolderPath, syncStrategy: new SyncStrategyFullSync(new Path({ pathString: '/' }))}
		// ];
		// ... It should:
		// 1. Get the desired state base tree from the target tree (neutralized clone)
		// 2. Run the recipe one by one, where each recipe item replaces the subtree at the specified path with the source subtree (also neutralized clone)

		addLog('Creating desired state tree from source...');
		try {
			const newLocal = new ChromeBookmarkRepository();
			const desiredState = cloneTree(targetTree);
			const syncFolderId = app.settings.snapshot.syncLocation;
			const syncFolderPath = await newLocal.getPathOf(
				await newLocal.getFolderBy({ id: syncFolderId })
			);

			const desiredSyncFolder =
				findNodeById(desiredState, syncFolderId) ??
				findNodeBySegments(desiredState, syncFolderPath.getSegments());
			if (!desiredSyncFolder || !desiredSyncFolder.isFolder()) {
				addLog(
					`Error: Sync folder not found in target tree (id=${syncFolderId}, path=${syncFolderPath.toString()})`
				);
				return;
			}

			desiredSyncFolder.children!.length = 0;
			for (const child of sourceTree.children || []) {
				desiredSyncFolder.addChild(cloneTree(child));
			}

			addLog('Desired state tree created successfully');
			desiredTree = desiredState;
			return desiredState;
		} catch (e: any) {
			addLog(`Error: ${e.message}`);
			console.error(e);
		}
	}

	/**
	 * Analyze differences between target and desired trees and build a sync plan.
	 * @returns Generated sync plan.
	 */
	async function runAnalyze() {
		if (!sourceTree || !targetTree) {
			addLog('Error: Fetch nodes and build trees first');
			return;
		}
		// currentState = targetTree
		const desiredState = (await makeDesiredState())!;

		// function printTree(node: TreeNode, prefix = '') {
		// 	console.log(`${prefix}- ${node.title} (${node.type})`);
		// 	for (const child of node.children || []) {
		// 		printTree(child, prefix + '  ');
		// 	}
		// }
		console.log('Source Tree:', sourceTree);
		// printTree(sourceTree);
		console.log('Target Tree:', targetTree);
		// printTree(targetTree);
		console.log('Desired State Tree:', desiredState);
		// printTree(desiredState);

		addLog('Analyzing differences...');
		try {
			const diff = new SyncDiffAnalyzer().compare(desiredState, targetTree);
			addLog(
				`Diff result: ${diff.onlyInLeft.length} to create, ${diff.inBothButDifferent.length} to update, ${diff.onlyInRight.length} to delete`
			);

			currentPlan = new SyncPlanner().generatePlan(diff);
			addLog(`Generated plan with ${currentPlan.actions.length} actions`);
			desiredTree = desiredState;

			return currentPlan;
		} catch (e: any) {
			addLog(`Error during analysis: ${e.message}`);
			console.error(e);
		}
		/**
		 *
		 */
	}

	/**
	 *
	 */
	async function runSync() {
		const plan = await runAnalyze();
		if (!plan) return;

		loading = true;
		addLog('Executing plan...');
		try {
			const chromeAdapter = new ChromeAdapter();
			const executor = new SyncExecutor();

			await executor.execute(plan, chromeAdapter);
			addLog('Sync execution completed');
		} catch (e: any) {
			addLog(`Error: ${e.message}`);
		} finally {
			loading = false;
		}
	}

	/**
	 *
	 */
	function clearLog() {
		log = [];
		currentPlan = null;
		desiredTree = null;
	}

	/**
	 * Resolve badge color for a sync action type.
	 * @param type Action type value.
	 * @returns Flowbite badge color.
	 */
	function getActionColor(type: string) {
		switch (type) {
			case 'create-bookmark':
			case 'create-folder':
				return 'green';
			case 'update-bookmark':
			case 'update-folder':
				return 'yellow';
			case 'delete':
				return 'red';
			default:
				return 'gray';
		}
	}
</script>

<div class="space-y-4">
	<Heading tag="h2" class="mb-4">New Sync Logic Test (Alpha)</Heading>

	<div class="flex gap-4">
		<Button color="alternative" onclick={runFetch} disabled={loading}>
			{#if loading}<Spinner size="4" class="mr-2" />{/if}
			<RefreshOutline size="sm" class="mr-2" />
			Fetch Trees
		</Button>
		<Button color="alternative" onclick={runAnalyze} disabled={loading || !sourceTree}>
			<SearchOutline size="sm" class="mr-2" />
			Analyze & Plan
		</Button>
		<Button color="primary" onclick={runSync} disabled={loading || !sourceTree || !targetTree}>
			<PlayOutline size="sm" class="mr-2" />
			Run Sync
		</Button>
		<Button color="light" onclick={clearLog}>Clear All</Button>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<Card size="xl" class="flex h-96 max-w-none flex-col shadow-none">
			<Heading tag="h5" class="mb-2">Execution Log</Heading>
			<div
				class="flex-1 overflow-y-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-green-400"
			>
				{#if log.length === 0}
					<P color="gray" class="italic">No logs yet. Click "Fetch Trees" to begin.</P>
				{/if}
				{#each log as entry, i (i)}
					<div>{entry}</div>
				{/each}
			</div>
		</Card>

		<Card size="xl" class="flex h-96 max-w-none flex-col shadow-none">
			<Heading tag="h5" class="mb-2">Generated Sync Plan</Heading>
			<div class="flex-1 overflow-y-auto rounded-lg border bg-gray-50 p-2">
				{#if !currentPlan}
					<P color="gray" class="p-4 italic">No plan generated yet. Click "Analyze & Plan".</P>
				{:else if currentPlan.actions.length === 0}
					<P color="green" class="p-4 text-center font-semibold"
						>Trees are in sync! No actions needed.</P
					>
				{:else}
					<div class="space-y-2">
						{#each currentPlan.actions as action, i (i)}
							<div class="rounded border border-gray-200 bg-white p-2 text-xs shadow-xs">
								<div class="mb-1 flex items-center justify-between">
									<Badge color={getActionColor(action.type)}>{action.type}</Badge>
									<span class="text-gray-400">#{i + 1}</span>
								</div>
								{#if action.type === 'create-bookmark'}
									<div class="font-semibold text-gray-800">{action.args.path.toString()}</div>
									<div class="truncate text-blue-500">{action.args.url}</div>
								{:else if action.type === 'create-folder'}
									<div class="font-semibold text-gray-800">{action.args.path.toString()}</div>
								{:else if action.type === 'update-bookmark'}
									<div class="text-gray-500">ID: {action.args.id}</div>
									<div class="truncate text-blue-500">{action.args.url || '(No URL Change)'}</div>
								{:else if action.type === 'update-folder'}
									<div class="text-gray-500">ID: {action.args.id}</div>
									<div class="truncate text-blue-500">
										{action.args.title || '(No Title Change)'}
									</div>
								{:else if action.type === 'delete'}
									<div class="font-semibold text-red-600">ID: {action.args.id}</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</Card>
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
		<Card size="md" class="flex h-125 max-w-none flex-col shadow-none">
			<Heading tag="h5" class="mb-2">Source (Raindrop) Tree</Heading>
			{#if sourceTree}
				<div class="flex-1 overflow-auto rounded-lg border bg-white p-2">
					<NewSyncTree treeNode={sourceTree} propagatingDefaults={{ collapsed: false }} />
				</div>
			{:else}
				<P color="gray">Not loaded</P>
			{/if}
		</Card>
		<Card size="md" class="flex h-125 max-w-none flex-col shadow-none">
			<Heading tag="h5" class="mb-2">Target (Chrome) Tree</Heading>
			{#if targetTree}
				<div class="flex-1 overflow-auto rounded-lg border bg-white p-2">
					<NewSyncTree treeNode={targetTree} propagatingDefaults={{ collapsed: false }} />
				</div>
			{:else}
				<P color="gray">Not loaded</P>
			{/if}
		</Card>
		<Card size="md" class="flex h-125 max-w-none flex-col shadow-none">
			<Heading tag="h5" class="mb-2">Desired State Tree</Heading>
			{#if desiredTree}
				<div class="flex-1 overflow-auto rounded-lg border bg-white p-2">
					<NewSyncTree treeNode={desiredTree} propagatingDefaults={{ collapsed: false }} />
				</div>
			{:else}
				<P color="gray">Not generated</P>
			{/if}
		</Card>
	</div>
</div>
