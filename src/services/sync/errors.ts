export class ConfigValidationError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		Object.setPrototypeOf(this, ConfigValidationError.prototype);
		this.name = 'ConfigValidationError';
	}
}
