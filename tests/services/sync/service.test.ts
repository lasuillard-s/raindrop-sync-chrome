import type { SettingsStore } from '$config';
import { SyncReport, WritableAdapter, type SyncAction } from '$lib/sync';
import {
	SYNC_BOOKMARKS_ALARM_NAME,
	SyncEvent,
	SyncService,
	type SyncEventListener
} from '$services/sync';
import { TestTreeNode } from '$test-helpers/tree';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

class TestWritableAdapter extends WritableAdapter<TestTreeNode> {
	protected resolveBaseNodeId(baseNodeId?: string): string {
		return baseNodeId ?? 'root';
	}

	protected async fetchNodes(baseNodeId: string): Promise<TestTreeNode[]> {
		return [
			new TestTreeNode({
				id: baseNodeId,
				parent: null,
				title: '',
				url: null,
				type: 'folder',
				raw: null
			})
		];
	}

	protected buildTree(nodes: TestTreeNode[]): TestTreeNode {
		return nodes[0];
	}

	async changedSince(): Promise<boolean> {
		return true;
	}

	async hasFolderWithId(): Promise<boolean> {
		return true;
	}

	async applyAction(action: SyncAction): Promise<void> {
		void action;
		return;
	}
}

class TestEventListenerImpl implements SyncEventListener {
	receivedEvents: SyncEvent[] = [];

	onEvent(event: SyncEvent): void {
		this.receivedEvents.push(event);
	}
}

/**
 * Creates a SyncService with controlled settings and test adapters.
 * @param snapshot Settings snapshot fields used by scheduling.
 * @param snapshot.autoSyncEnabled Whether auto sync scheduling is enabled.
 * @param snapshot.autoSyncExecOnStartup Whether first execution should run immediately.
 * @param snapshot.autoSyncIntervalInMinutes Recurring sync period in minutes.
 * @param snapshot.syncLocation Sync location to be returned by settings snapshot; defaults to 'sync-folder'.
 * @param eventListener Optional event listener to attach to the service for testing emitted events.
 * @returns SyncService configured with test adapters.
 */
function createService(
	snapshot: {
		autoSyncEnabled: boolean;
		autoSyncExecOnStartup: boolean;
		autoSyncIntervalInMinutes: number;
		syncLocation?: string;
	},
	eventListener?: SyncEventListener
) {
	const adapter = new TestWritableAdapter();
	const settingsSnapshot = {
		clientLastSync: new Date(0),
		syncLocation: snapshot.syncLocation ?? 'sync-folder',
		...snapshot
	};
	const appSettings = {
		snapshot: settingsSnapshot,
		ready: vi.fn(async () => undefined),
		snapshotReady: vi.fn(async () => settingsSnapshot),
		update: vi.fn(async () => undefined)
	} as unknown as SettingsStore;
	const service = new SyncService({
		source: adapter,
		target: adapter,
		appSettings
	});
	if (eventListener) {
		service.addEventListener(eventListener);
	}
	return service;
}

describe('SyncService', () => {
	it('uses the provided sync location when constructing desired state', async () => {
		// Arrange
		const service = createService({
			autoSyncEnabled: false,
			autoSyncExecOnStartup: false,
			autoSyncIntervalInMinutes: 5,
			syncLocation: 'sync-folder'
		});
		const targetTree = new TestTreeNode({ id: 'root', title: '', type: 'folder' });
		new TestTreeNode({
			id: 'sync-folder',
			title: 'Synced',
			type: 'folder',
			parent: targetTree
		});
		const sourceTree = new TestTreeNode({ id: 'source-root', title: '', type: 'folder' });
		new TestTreeNode({
			id: 'bookmark',
			title: 'Bookmark',
			type: 'bookmark',
			url: 'https://example.com',
			parent: sourceTree
		});

		// Act
		const desiredState = service.buildDesiredState({
			targetTree,
			sourceTree,
			syncLocationId: 'sync-folder'
		});

		// Assert
		expect(desiredState.children).toHaveLength(1);
		expect(desiredState.children?.[0].children).toHaveLength(1);
		expect(desiredState.children?.[0].children?.[0].title).toBe('Bookmark');
	});

	it('skips synchronization when checkShouldSync returns false', async () => {
		// Arrange
		const eventListener = new TestEventListenerImpl();
		const service = createService(
			{
				autoSyncEnabled: false,
				autoSyncExecOnStartup: false,
				autoSyncIntervalInMinutes: 5
			},
			eventListener
		);
		service.checkShouldSync = vi.fn(async () => false);

		// Act
		const result = await service.runFullSync({ plan: { actions: [] } as any }, { force: false });

		// Assert
		expect(result).toBeUndefined();
		expect(service.checkShouldSync).toHaveBeenCalled();
		expect(eventListener.receivedEvents.map((event) => event.toMessage())).toEqual([
			'Synchronization started.',
			'Validating configuration...',
			'Synchronization was skipped.'
		]);
	});

	it('updates clientLastSync after a successful sync run', async () => {
		// Arrange
		const eventListener = new TestEventListenerImpl();
		const service = createService(
			{
				autoSyncEnabled: false,
				autoSyncExecOnStartup: false,
				autoSyncIntervalInMinutes: 5
			},
			eventListener
		);
		service.executor = {
			execute: vi.fn(async () => new SyncReport())
		} as any;

		// Act
		await service.runFullSync({ plan: { actions: [] } as any }, { force: true });

		// Assert
		expect(service.appSettings.update).toHaveBeenCalledWith({
			clientLastSync: expect.any(Date)
		});
		expect(eventListener.receivedEvents.map((event) => event.toMessage())).toEqual([
			'Synchronization started.',
			'Validating configuration...',
			'Executing synchronization plan...',
			'Synchronization completed successfully.'
		]);
	});
});

describe('SyncService.scheduleAutoSync', () => {
	let spyClearAll: Mock;
	let spyCreate: Mock;

	beforeEach(() => {
		spyClearAll = vi.spyOn(browser.alarms, 'clearAll');
		spyCreate = vi.spyOn(browser.alarms, 'create');
	});

	it('clears alarms and does not schedule when auto sync is disabled', async () => {
		// Arrange
		const service = createService({
			autoSyncEnabled: false,
			autoSyncExecOnStartup: false,
			autoSyncIntervalInMinutes: 15
		});

		// Act
		await service.scheduleAutoSync();

		// Assert
		expect(spyClearAll).toHaveBeenCalledTimes(1);
		expect(spyCreate).not.toHaveBeenCalled();
	});

	it('schedules recurring alarm with immediate startup delay when enabled', async () => {
		// Arrange
		const service = createService({
			autoSyncEnabled: true,
			autoSyncExecOnStartup: true,
			autoSyncIntervalInMinutes: 10
		});

		// Act
		await service.scheduleAutoSync();

		// Assert
		expect(spyClearAll).toHaveBeenCalledTimes(1);
		expect(spyCreate).toHaveBeenCalledWith(SYNC_BOOKMARKS_ALARM_NAME, {
			periodInMinutes: 10
		});
	});
});
