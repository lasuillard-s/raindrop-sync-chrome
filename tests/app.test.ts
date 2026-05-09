import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('App', () => {
	let App: typeof import('~/app').App;

	beforeEach(async () => {
		vi.resetModules();
		// Re-import after resetting modules so the singleton is fresh for each test.
		({ App } = await import('~/app'));
	});

	it('returns the same singleton instance from App.getInstance', () => {
		// Act
		const first = App.getInstance();
		const second = App.getInstance();

		// Assert
		expect(first).toBe(second);
	});
});
