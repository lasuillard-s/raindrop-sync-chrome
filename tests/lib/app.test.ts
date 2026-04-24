import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserProxy } from '~/lib/browser';

describe('App', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('returns the same singleton instance from App.getInstance', async () => {
		// Arrange
		const { App } = await import('~/lib/app');

		// Act
		const first = App.getInstance();
		const second = App.getInstance();

		// Assert
		expect(first).toBe(second);
	});

	it('preserves constructor-based dependency injection', async () => {
		// Arrange
		const { App } = await import('~/lib/app');
		const browserProxy = {} as BrowserProxy;

		// Act
		const app = new App(browserProxy);

		// Assert
		expect(app.browserProxy).toBe(browserProxy);
	});
});
