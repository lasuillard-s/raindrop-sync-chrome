import type { ChromeBookmarkRepository } from '~/lib/browser/chrome';
import { Path } from '~/lib/util/path';

export abstract class SyncOp {
	abstract apply(repository: ChromeBookmarkRepository): void;
}

export class SyncOpNoop extends SyncOp {
	readonly args: {
		path: string;
	};

	constructor(args: { path: string }) {
		super();
		this.args = args;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	apply(repository: ChromeBookmarkRepository) {
		// No operation needed for noop
		console.debug('Applying SyncOpNoop for path:', this.args.path);
	}
}

export class SyncOpAdd extends SyncOp {
	readonly args: {
		path: string;
		title: string;
		url: string;
	};

	constructor(args: { path: string; title: string; url: string }) {
		super();
		this.args = args;
	}

	apply(repository: ChromeBookmarkRepository) {
		console.debug('Applying SyncOpAdd for path:', this.args.path);
		repository.createBookmark(new Path({ fullPath: this.args.path }), {
			title: this.args.title,
			url: this.args.url
		});
	}
}

export class SyncOpUpdate extends SyncOp {
	readonly args: {
		path: string;
		title?: string;
		url?: string;
	};

	constructor(args: { path: string; title?: string; url?: string }) {
		super();
		this.args = args;
	}

	apply(repository: ChromeBookmarkRepository) {
		console.debug('Applying SyncOpUpdate for path:', this.args.path);
		repository.updateBookmark(new Path({ fullPath: this.args.path }), {
			title: this.args.title,
			url: this.args.url
		});
	}
}

export class SyncOpDelete extends SyncOp {
	readonly args: {
		path: string;
	};

	constructor(args: { path: string }) {
		super();
		this.args = args;
	}

	apply(repository: ChromeBookmarkRepository) {
		console.debug('Applying SyncOpDelete for path:', this.args.path);
		repository.deleteBookmark(new Path({ fullPath: this.args.path }));
	}
}
