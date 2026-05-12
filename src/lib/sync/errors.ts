export class BookmarkIsNotAFolderError extends Error {
	constructor(nodeId: string, options?: ErrorOptions) {
		super(`Node with id ${nodeId} is not a folder`, options);
		Object.setPrototypeOf(this, BookmarkIsNotAFolderError.prototype);
		this.name = 'BookmarkIsNotAFolderError';
	}
}

export class DuplicateBookmarkError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		Object.setPrototypeOf(this, DuplicateBookmarkError.prototype);
		this.name = 'DuplicateBookmarkError';
	}
}
