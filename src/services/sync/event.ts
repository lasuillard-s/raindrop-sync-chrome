export interface SyncEventListener {
	onEvent(event: SyncEvent): void;
}

export enum SyncEventType {
	Start = 'start',
	Progress = 'progress',
	Complete = 'complete',
	Error = 'error'
}
export abstract class SyncEvent {
	abstract type: SyncEventType;

	abstract toMessage(): string;
}

export class SyncEventStart extends SyncEvent {
	type = SyncEventType.Start;

	toMessage(): string {
		return 'Synchronization started.';
	}
}

export enum SyncEventProgressDetail {
	Validating = 'validating',
	CheckShouldSync = 'check-should-sync',
	FetchingSource = 'fetching-source',
	FetchingTarget = 'fetching-target',
	CalculatingDiff = 'calculating-diff',
	GeneratingPlan = 'generating-plan',
	OptimizingPlan = 'optimizing-plan',
	ExecutingPlan = 'executing-plan'
}
export class SyncEventProgress extends SyncEvent {
	type = SyncEventType.Progress;
	progress: SyncEventProgressDetail;

	constructor(progress: SyncEventProgressDetail) {
		super();
		this.progress = progress;
	}

	toMessage(): string {
		switch (this.progress) {
			case SyncEventProgressDetail.Validating:
				return 'Validating configuration...';
			case SyncEventProgressDetail.CheckShouldSync:
				return 'Checking if synchronization is needed...';
			case SyncEventProgressDetail.FetchingSource:
				return 'Fetching source data...';
			case SyncEventProgressDetail.FetchingTarget:
				return 'Fetching target data...';
			case SyncEventProgressDetail.CalculatingDiff:
				return 'Calculating differences...';
			case SyncEventProgressDetail.GeneratingPlan:
				return 'Generating synchronization plan...';
			case SyncEventProgressDetail.OptimizingPlan:
				return 'Optimizing synchronization plan...';
			case SyncEventProgressDetail.ExecutingPlan:
				return 'Executing synchronization plan...';
		}
	}
}

export class SyncEventComplete extends SyncEvent {
	type = SyncEventType.Complete;

	toMessage(): string {
		return 'Synchronization completed successfully.';
	}
}

export class SyncEventError extends SyncEvent {
	type = SyncEventType.Error;
	error: any;

	constructor(error: any) {
		super();
		this.error = error;
	}

	toMessage(): string {
		return `Synchronization failed with error: ${this.error}`;
	}
}
