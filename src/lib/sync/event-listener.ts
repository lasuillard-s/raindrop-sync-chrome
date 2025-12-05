export abstract class SyncEvent {
	abstract type: string;

	/** Convert the event to a human-readable message. */
	abstract toMessage(): string;
}

export class SyncEventStart extends SyncEvent {
	type = 'start';

	toMessage(): string {
		return 'Synchronization started.';
	}
}

export type SyncEventProgressKind =
	| 'validating'
	| 'check-should-sync'
	| 'fetching-collections'
	| 'clearing-bookmarks'
	| 'creating-bookmarks';

export class SyncEventProgress extends SyncEvent {
	type = 'progress';
	progress: SyncEventProgressKind;

	constructor(progress: SyncEventProgressKind) {
		super();
		this.progress = progress;
	}

	toMessage(): string {
		switch (this.progress) {
			case 'validating':
				return 'Validating...';
			case 'check-should-sync':
				return 'Checking if sync is needed...';
			case 'fetching-collections':
				return 'Fetching collections...';
			case 'clearing-bookmarks':
				return 'Clearing bookmarks...';
			case 'creating-bookmarks':
				return 'Creating bookmarks...';
		}
	}
}
export class SyncEventComplete extends SyncEvent {
	type = 'complete';

	toMessage(): string {
		return 'Synchronization completed successfully.';
	}
}

export class SyncEventError extends SyncEvent {
	type = 'error';
	error: any;

	constructor(error: any) {
		super();
		this.error = error;
	}

	toMessage(): string {
		return `Synchronization failed with error: ${this.error}`;
	}
}

export interface SyncEventListener {
	onEvent(event: SyncEvent): void;
}
