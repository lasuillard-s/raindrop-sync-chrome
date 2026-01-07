import type { ChromeBookmarkRepository } from '~/lib/browser/chrome';
import { Path } from '~/lib/util/path';

export abstract class SyncOp {
	abstract apply(repository: ChromeBookmarkRepository): Promise<void>;
}

export class SyncOpNoop extends SyncOp {
	readonly args: {
		path: Path;
	};

	constructor(args: { path: Path }) {
		super();
		this.args = args;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async apply(repository: ChromeBookmarkRepository) {
		// No operation needed for noop
		console.debug('Applying SyncOpNoop for path:', this.args.path);
	}
}

export class SyncOpAdd extends SyncOp {
	readonly args: {
		path: Path;
		title: string;
		url: string;
	};

	constructor(args: { path: Path; title: string; url: string }) {
		super();
		this.args = args;
	}

	async apply(repository: ChromeBookmarkRepository) {
		console.debug('Applying SyncOpAdd for path:', this.args.path);
		await repository.createBookmark(
			this.args.path,
			{
				title: this.args.title,
				url: this.args.url
			},
			{
				createParentIfNotExists: true
			}
		);
	}
}

export class SyncOpUpdate extends SyncOp {
	readonly args: {
		path: Path;
		title?: string;
		url?: string;
	};

	constructor(args: { path: Path; title?: string; url?: string }) {
		super();
		this.args = args;
	}

	async apply(repository: ChromeBookmarkRepository) {
		console.debug('Applying SyncOpUpdate for path:', this.args.path);
		await repository.updateBookmark(this.args.path, {
			title: this.args.title,
			url: this.args.url
		});
	}
}

export class SyncOpDelete extends SyncOp {
	readonly args: {
		path: Path;
	};

	constructor(args: { path: Path }) {
		super();
		this.args = args;
	}

	async apply(repository: ChromeBookmarkRepository) {
		console.debug('Applying SyncOpDelete for path:', this.args.path);
		await repository.deleteBookmark(this.args.path);
	}
}
