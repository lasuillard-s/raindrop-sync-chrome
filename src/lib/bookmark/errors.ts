export class PathConflictError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, PathConflictError.prototype);
		this.name = 'PathConflictError';
	}
}
