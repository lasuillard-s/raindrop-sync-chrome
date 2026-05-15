// @vitest-environment happy-dom
import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, expect, it, vi } from 'vitest';

// These tests only cover tab/hash synchronization. The real tab panels mount settings,
// browser, and sync integrations that are unrelated to this behavior, so they are
// replaced with a minimal Svelte stub to keep the assertions focused and deterministic.
vi.mock(
	'~/options/tabs/Bookmarks.svelte',
	async () => await import('./__mocks__/options/StubTab.svelte')
);
vi.mock(
	'~/options/tabs/TryIt.svelte',
	async () => await import('./__mocks__/options/StubTab.svelte')
);
vi.mock(
	'~/options/tabs/Integration.svelte',
	async () => await import('./__mocks__/options/StubTab.svelte')
);
vi.mock(
	'~/options/tabs/About.svelte',
	async () => await import('./__mocks__/options/StubTab.svelte')
);

import App from '~/options/App.svelte';

beforeEach(() => {
	window.location.hash = '';
});

it('defaults to the bookmarks hash when the page loads without one', () => {
	render(App);

	expect(window.location.hash).toBe('#bookmarks');
	const bookmarksTab = document.getElementById('bookmarks');
	expect(bookmarksTab).toBeTruthy();
	expect(bookmarksTab?.getAttribute('aria-selected')).toBe('true');
});

it('restores the selected tab from the URL hash', () => {
	window.location.hash = '#integration';

	render(App);

	const integrationTab = document.getElementById('integration');
	expect(integrationTab).toBeTruthy();
	expect(integrationTab?.getAttribute('aria-selected')).toBe('true');
});

it('updates the URL hash when the selected tab changes', async () => {
	render(App);

	const aboutTab = document.getElementById('about');
	expect(aboutTab).toBeTruthy();

	await fireEvent.click(aboutTab!);

	expect(window.location.hash).toBe('#about');
	expect(document.getElementById('about')?.getAttribute('aria-selected')).toBe('true');
});

it('updates the selected tab when the URL hash changes externally', async () => {
	render(App);

	window.location.hash = '#try-it';
	await fireEvent(window, new Event('hashchange'));

	expect(document.getElementById('try-it')?.getAttribute('aria-selected')).toBe('true');
});
