import { ChromeAlarmScheduler } from '@lib/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe('ChromeAlarmScheduler', () => {
	it('delegates clearAll to chrome.alarms.clearAll', async () => {
		// Arrange
		const clearAll = vi.fn(async () => true);
		const create = vi.fn(async () => undefined);
		vi.stubGlobal('chrome', {
			alarms: {
				clearAll,
				create
			}
		});
		const scheduler = new ChromeAlarmScheduler();

		// Act
		await scheduler.clearAll();

		// Assert
		expect(clearAll).toHaveBeenCalledTimes(1);
	});

	it('delegates create to chrome.alarms.create with the same arguments', async () => {
		// Arrange
		const clearAll = vi.fn(async () => true);
		const create = vi.fn(async () => undefined);
		vi.stubGlobal('chrome', {
			alarms: {
				clearAll,
				create
			}
		});
		const scheduler = new ChromeAlarmScheduler();

		// Act
		await scheduler.create('sync-bookmarks', {
			delayInMinutes: 0,
			periodInMinutes: 15
		});

		// Assert
		expect(create).toHaveBeenCalledWith('sync-bookmarks', {
			delayInMinutes: 0,
			periodInMinutes: 15
		});
	});
});
