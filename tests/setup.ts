import { mocks as chromeBookmarkMocks } from '@test-helpers/chrome-bookmarks';
import { cleanup } from '@testing-library/svelte';
import { afterEach, beforeEach, vi } from 'vitest';
import { InMemoryStorageAdapter, SettingsRepository, SettingsStore } from '~/config';

beforeEach(() => {
	// Tried to use both sinon-chrome and vitest-chrome, but it seems both are not being
	// maintained for a while. So opted to just stub the parts we need directly.
	vi.stubGlobal('chrome', {
		// Here only provide sane defaults and scaffolding for the parts we use in tests.
		// Each test can follow pattern like:
		//
		// vi.mocked(chrome.bookmarks.getSubTree).mockImplementationOnce(...)
		//
		bookmarks: {
			...chromeBookmarkMocks
		},
		identity: {
			getRedirectURL: vi.fn(),
			launchWebAuthFlow: vi.fn()
		}
	});
	vi.spyOn(SettingsStore, 'getOrCreate').mockImplementation(() => {
		const adapter = new InMemoryStorageAdapter();
		const repository = new SettingsRepository(adapter);
		return new SettingsStore(repository);
	});
});

afterEach(() => {
	vi.resetAllMocks();
	cleanup();
});
