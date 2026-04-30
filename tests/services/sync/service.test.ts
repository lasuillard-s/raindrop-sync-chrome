import { ChromeAlarmScheduler } from '@lib/browser';
import { WritableAdapter, type SyncAction } from '@lib/sync';
import { TestTreeNode } from '@test-helpers/tree';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SYNC_BOOKMARKS_ALARM_NAME, SyncService } from '~/services/sync';

const clearAll = vi.fn(async () => undefined);
const create = vi.fn(async () => undefined);

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

/**
 * Creates a SyncService with controlled settings and test adapters.
 * @param snapshot Settings snapshot fields used by scheduling.
 * @param snapshot.autoSyncEnabled Whether auto sync scheduling is enabled.
 * @param snapshot.autoSyncExecOnStartup Whether first execution should run immediately.
 * @param snapshot.autoSyncIntervalInMinutes Recurring sync period in minutes.
 * @returns SyncService configured with test adapters.
 */
function createService(snapshot: {
	autoSyncEnabled: boolean;
	autoSyncExecOnStartup: boolean;
	autoSyncIntervalInMinutes: number;
}) {
	const adapter = new TestWritableAdapter();
	return new SyncService({
		source: adapter,
		target: adapter,
		appSettings: { snapshot } as any
	});
}

describe('SyncService.scheduleAutoSync', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		clearAll.mockClear();
		create.mockClear();
		vi.spyOn(ChromeAlarmScheduler.prototype, 'clearAll').mockImplementation(clearAll);
		vi.spyOn(ChromeAlarmScheduler.prototype, 'create').mockImplementation(create);
	});

	it('clears alarms and does not schedule when auto sync is disabled', async () => {
		const service = createService({
			autoSyncEnabled: false,
			autoSyncExecOnStartup: false,
			autoSyncIntervalInMinutes: 15
		});

		await service.scheduleAutoSync();

		expect(clearAll).toHaveBeenCalledTimes(1);
		expect(create).not.toHaveBeenCalled();
	});

	it('schedules recurring alarm with immediate startup delay when enabled', async () => {
		const service = createService({
			autoSyncEnabled: true,
			autoSyncExecOnStartup: true,
			autoSyncIntervalInMinutes: 10
		});

		await service.scheduleAutoSync();

		expect(clearAll).toHaveBeenCalledTimes(1);
		expect(create).toHaveBeenCalledWith(SYNC_BOOKMARKS_ALARM_NAME, {
			delayInMinutes: 0,
			periodInMinutes: 10
		});
	});
});
