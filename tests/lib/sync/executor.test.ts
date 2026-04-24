import { describe, expect, it, vi } from 'vitest';
import type { ChromeBookmarkRepository } from '~/lib/browser';
import { SyncExecutor } from '~/lib/sync/executor';
import { SyncOp } from '~/lib/sync/op';
import { SyncPlan } from '~/lib/sync/plan';

class RecordingOp extends SyncOp {
	constructor(
		private readonly label: string,
		private readonly log: string[],
		private readonly repositoryRefs: ChromeBookmarkRepository[],
		private readonly fail = false
	) {
		super();
	}

	async apply(repository: ChromeBookmarkRepository) {
		this.repositoryRefs.push(repository);
		this.log.push(this.label);

		if (this.fail) {
			throw new Error(`failed:${this.label}`);
		}
	}
}

describe('SyncExecutor', () => {
	it('executes plan operations in order against the provided repository', async () => {
		// Arrange
		const repository = {} as ChromeBookmarkRepository;
		const executionLog: string[] = [];
		const repositoryRefs: ChromeBookmarkRepository[] = [];
		const plan = new SyncPlan();
		plan.addOp(new RecordingOp('first', executionLog, repositoryRefs));
		plan.addOp(new RecordingOp('second', executionLog, repositoryRefs));
		plan.addOp(new RecordingOp('third', executionLog, repositoryRefs));

		// Act
		await new SyncExecutor({ repository, plan }).execute();

		// Assert
		expect(executionLog).toEqual(['first', 'second', 'third']);
		expect(repositoryRefs).toEqual([repository, repository, repository]);
	});

	it('stops executing once an operation throws', async () => {
		// Arrange
		const repository = {} as ChromeBookmarkRepository;
		const executionLog: string[] = [];
		const repositoryRefs: ChromeBookmarkRepository[] = [];
		const plan = new SyncPlan();
		plan.addOp(new RecordingOp('first', executionLog, repositoryRefs));
		plan.addOp(new RecordingOp('second', executionLog, repositoryRefs, true));
		plan.addOp(new RecordingOp('third', executionLog, repositoryRefs));

		// Act
		const execute = vi.fn(async () => await new SyncExecutor({ repository, plan }).execute());

		// Assert
		await expect(execute()).rejects.toThrow('failed:second');
		expect(executionLog).toEqual(['first', 'second']);
		expect(repositoryRefs).toEqual([repository, repository]);
	});
});
