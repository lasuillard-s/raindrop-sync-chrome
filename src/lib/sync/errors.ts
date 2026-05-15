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

export class NodeNotFoundError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		Object.setPrototypeOf(this, NodeNotFoundError.prototype);
		this.name = 'NodeNotFoundError';
	}
}

export class InvalidSearchQueryError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		Object.setPrototypeOf(this, InvalidSearchQueryError.prototype);
		this.name = 'InvalidSearchQueryError';
	}
}

export class AssertionError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		Object.setPrototypeOf(this, AssertionError.prototype);
		this.name = 'AssertionError';
	}
}
