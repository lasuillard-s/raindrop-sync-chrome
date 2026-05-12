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
