import { ChromeAlarmScheduler } from '@lib/browser';
import type { ReadableAdapter, SyncPlan, SyncReport, WritableAdapter } from '@lib/sync';
import { SyncDiffAnalyzer, SyncExecutor, SyncPlanner, SyncPlanOptimizer } from '@lib/sync';
import { NeutralTreeNode, type TreeNode } from '@lib/sync/tree';
import type { SettingsStore } from '~/config';
import {
	SyncEventComplete,
	SyncEventError,
	SyncEventProgress,
	SyncEventProgressDetail,
	SyncEventStart,
	type SyncEvent,
	type SyncEventListener
} from './event';

export const SYNC_BOOKMARKS_ALARM_NAME = 'sync-bookmarks';

export class SyncService {
	source: ReadableAdapter;
	target: WritableAdapter;
	appSettings: SettingsStore;
	diffAnalyzer: SyncDiffAnalyzer;
	planner: SyncPlanner;
	planOptimizer: SyncPlanOptimizer;
	executor: SyncExecutor;
	listeners: SyncEventListener[];

	constructor(options: {
		source: ReadableAdapter;
		target: WritableAdapter;
		appSettings: SettingsStore;
		diffAnalyzer?: SyncDiffAnalyzer;
		planner?: SyncPlanner;
		planOptimizer?: SyncPlanOptimizer;
		executor?: SyncExecutor;
	}) {
		this.source = options.source;
		this.target = options.target;
		this.appSettings = options.appSettings;
		this.diffAnalyzer = options?.diffAnalyzer ?? new SyncDiffAnalyzer();
		this.planner = options?.planner ?? new SyncPlanner();
		this.planOptimizer = options?.planOptimizer ?? new SyncPlanOptimizer();
		this.executor = options?.executor ?? new SyncExecutor();
		this.listeners = [];
	}

	/**
	 * Validate the synchronization configuration, such as checking if the target folder exists.
	 * @returns A promise that resolves to true if the configuration is valid, false otherwise.
	 */
	async validateConfig(): Promise<boolean> {
		this.emitEvent(new SyncEventProgress(SyncEventProgressDetail.Validating));
		if (!this.target.hasFolderWithId(this.appSettings.snapshot.syncLocation)) {
			return false;
		}
		return true;
	}

	/**
	 * Check if synchronization is needed by comparing the last sync time with the last modified time of source and target.
	 * @param thresholdSeconds Optional threshold in seconds to consider changes as significant. Default is 5 minutes.
	 * @returns A promise that resolves to true if synchronization is needed, false otherwise.
	 */
	async checkShouldSync(thresholdSeconds?: number): Promise<boolean> {
		thresholdSeconds = thresholdSeconds ?? 60 * 5; // Default to 5 minutes
		this.emitEvent(new SyncEventProgress(SyncEventProgressDetail.CheckShouldSync));

		// Check if there have been changes in either source or target since last sync
		const clientLastSync = this.appSettings.snapshot.clientLastSync; // Default is Date(0)
		const sourceChanged = await this.source.changedSince(clientLastSync, { thresholdSeconds });
		const targetChanged = await this.target.changedSince(clientLastSync, { thresholdSeconds });

		// Either source or target has changed - sync is needed
		if (sourceChanged || targetChanged) {
			return true;
		}

		// If neither source nor target has changed since last sync, no need to sync
		return false;
	}

	/**
	 * Construct the current state tree by cloning the target tree.
	 *
	 * This represents the "as-is" state of the bookmarks before synchronization.
	 * @param args Arguments for building the current state tree.
	 * @param args.targetTree The target tree representing the current state of bookmarks.
	 * @returns The current state tree cloned from the target tree.
	 */
	buildCurrentState(args: { targetTree: TreeNode }): NeutralTreeNode {
		const { targetTree } = args;
		return NeutralTreeNode.cloneFrom(targetTree);
	}

	/**
	 * Construct the desired state tree by merging the source tree into the target tree at the sync location.
	 *
	 * The desired state represents the "to-be" state of the bookmarks after synchronization,
	 * which is derived from the source tree but structured according to the target tree
	 * with the sync folder as the root.
	 * @param args Arguments for building the desired state tree.
	 * @param args.targetTree The current state tree built from the target adapter, used as the base for constructing the desired state.
	 * @param args.sourceTree The source tree containing the desired bookmarks structure to merge into the target tree.
	 * @returns The desired state tree after merging the source tree into the target tree at the sync location.
	 */
	buildDesiredState(args: { targetTree: TreeNode; sourceTree: TreeNode }): NeutralTreeNode {
		const { targetTree, sourceTree } = args;
		const desiredState = NeutralTreeNode.cloneFrom(targetTree);

		// Find the sync folder node in the desired state tree
		const syncFolderId = this.appSettings.snapshot.syncLocation;
		let syncFolder: NeutralTreeNode | null = null;
		desiredState.bfs((node) => {
			console.debug(
				`Checking node ${node.getPath().toString()} (id: ${node.id}) against sync location id ${syncFolderId}`
			);
			if (node.id === syncFolderId) {
				syncFolder = node;
				return 'break';
			}
		});
		if (!syncFolder) {
			throw new Error(`Sync folder (${syncFolderId}) not found in the desired state tree.`);
		}
		// ? Workaround for wrong type inference
		syncFolder = syncFolder as NeutralTreeNode;

		// In-place update the sync folder node in the desired state tree with the
		syncFolder.children?.splice(0, syncFolder.children.length);
		sourceTree.children?.forEach((child) => {
			syncFolder!.addChild(child);
		});

		return desiredState;
	}

	/**
	 * Perform the synchronization process, including fetching trees, generating diff, creating and optimizing plan, and executing the plan.
	 * @param args Optional arguments for the sync process.
	 * @param args.plan An externally provided sync plan to execute. If not provided, the service will generate a plan by comparing source and target.
	 * @param options Optional settings for the sync process.
	 * @param options.dryRun If true, generates the sync plan but does not execute it.
	 * @returns A promise that resolves to the sync report if executed, or null if dry run.
	 */
	async doSync(
		args?: { plan?: SyncPlan },
		options?: { dryRun?: boolean }
	): Promise<SyncReport | null> {
		let plan = args?.plan;
		if (!plan) {
			// Build source tree (to-be)
			this.emitEvent(new SyncEventProgress(SyncEventProgressDetail.FetchingSource));
			const sourceTree = await this.source.getTree();

			// Build target tree (as-is)
			this.emitEvent(new SyncEventProgress(SyncEventProgressDetail.FetchingTarget));
			const targetTree = await this.target.getTree();

			// Get current state (as-is) and desired state (to-be) based on source and target trees
			this.emitEvent(new SyncEventProgress(SyncEventProgressDetail.ConstructingStates));
			const currentState = this.buildCurrentState({ targetTree });
			const desiredState = this.buildDesiredState({ targetTree, sourceTree });

			// Compare the two trees to generate a diff
			this.emitEvent(new SyncEventProgress(SyncEventProgressDetail.CalculatingDiff));
			const diff = this.diffAnalyzer.compare(desiredState, currentState);

			// Generate a sync plan based on the diff
			this.emitEvent(new SyncEventProgress(SyncEventProgressDetail.GeneratingPlan));
			plan = this.planner.generatePlan(diff);

			// Optimize the sync plan
			this.emitEvent(new SyncEventProgress(SyncEventProgressDetail.OptimizingPlan));
			plan = this.planOptimizer.optimize(plan);
		}

		// Execute the sync plan to update the target to match the source
		this.emitEvent(new SyncEventProgress(SyncEventProgressDetail.ExecutingPlan));
		if (options?.dryRun) {
			console.warn('Dry run mode enabled - no changes will be applied');
			return null;
		}

		const report = await this.executor.execute(plan, this.target);
		return report;
	}

	/**
	 * Run the full synchronization process, including validation, diffing, planning, and execution.
	 * @param args Optional arguments for the sync process.
	 * @param args.plan An externally provided sync plan to execute. If not provided, the service will generate a plan by comparing source and target.
	 * @param options Optional settings for the sync process.
	 * @param options.dryRun If true, generates the sync plan but does not execute it.
	 * @param options.force If true, forces synchronization even if checkShouldSync returns false.
	 * @returns A promise that resolves when the sync process is complete.
	 */
	async runFullSync(
		args?: { plan?: SyncPlan },
		options?: { dryRun?: boolean; force?: boolean }
	): Promise<void> {
		try {
			this.emitEvent(new SyncEventStart());

			// Validate configurations
			const isValid = await this.validateConfig();
			if (!isValid) {
				console.error('Sync configuration is invalid');
				return;
			}

			// Check if synchronization is needed (unless forced)
			if (!options?.force) {
				const shouldSync = await this.checkShouldSync();
				if (!shouldSync) {
					console.info('No synchronization needed - target is already up to date');
					return;
				}
			}

			// Perform the synchronization
			await this.doSync({ plan: args?.plan }, { dryRun: options?.dryRun });

			this.emitEvent(new SyncEventComplete());
		} catch (error) {
			console.error('Sync configuration validation failed:', error);
			this.emitEvent(new SyncEventError(error));
		}
	}

	/**
	 * Schedule recurring sync alarm using current settings.
	 */
	async scheduleAutoSync(): Promise<void> {
		const scheduler = new ChromeAlarmScheduler();
		await scheduler.clearAll();

		if (!this.appSettings.snapshot.autoSyncEnabled) {
			return;
		}

		const delayInMinutes = this.appSettings.snapshot.autoSyncExecOnStartup
			? 0
			: this.appSettings.snapshot.autoSyncIntervalInMinutes;

		await scheduler.create(SYNC_BOOKMARKS_ALARM_NAME, {
			delayInMinutes,
			periodInMinutes: this.appSettings.snapshot.autoSyncIntervalInMinutes
		});
	}

	// Event handling
	// -------------------------------------------------------------------------
	/**
	 * Add a listener for sync events. Listeners will be notified of progress, completion, and errors during the sync process.
	 * @param listener The listener to add
	 */
	addEventListener(listener: SyncEventListener): void {
		console.debug('Adding sync event listener:', listener);
		this.listeners.push(listener);
	}

	/**
	 * Remove a previously added listener for sync events.
	 * @param listener The listener to remove
	 */
	removeEventListener(listener: SyncEventListener): void {
		console.debug('Removing sync event listener:', listener);
		this.listeners = this.listeners.filter((l) => l !== listener);
	}

	/**
	 * Emit a sync event to all registered listeners. This is used internally to notify listeners of progress, completion, and errors during the sync process.
	 * @param event The event to emit
	 */
	protected emitEvent(event: SyncEvent): void {
		console.debug('Emitting sync event:', event);
		for (const [index, listener] of this.listeners.entries()) {
			console.debug(`Notifying listener ${index + 1}/${this.listeners.length}:`, listener);
			try {
				listener.onEvent(event);
			} catch (error) {
				console.error('Error in sync event listener:', error);
			}
		}
	}
}
