export class FolderNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, FolderNotFoundError.prototype);
		this.name = 'FolderNotFoundError';
	}
}

export class BookmarkNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, BookmarkNotFoundError.prototype);
		this.name = 'BookmarkNotFoundError';
	}
}
