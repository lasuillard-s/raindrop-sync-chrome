// @vitest-environment happy-dom
import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock(
	'~/options/tabs/Bookmarks.svelte',
	async () => await import('../mocks/options/StubTab.svelte')
);
vi.mock('~/options/tabs/TryIt.svelte', async () => await import('../mocks/options/StubTab.svelte'));
vi.mock(
	'~/options/tabs/Integration.svelte',
	async () => await import('../mocks/options/StubTab.svelte')
);
vi.mock('~/options/tabs/About.svelte', async () => await import('../mocks/options/StubTab.svelte'));

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
