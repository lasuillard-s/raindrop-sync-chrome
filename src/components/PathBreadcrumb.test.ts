// @vitest-environment happy-dom
import { render } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import PathBreadcrumb from './PathBreadcrumb.svelte';

it('renders component with pathSegments', async () => {
	const { getByTestId, queryByTestId } = render(PathBreadcrumb, {
		pathSegments: ['folder', 'subfolder', 'item']
	});
	expect(getByTestId('path-segment-0').textContent).toBe('folder');
	expect(getByTestId('path-segment-1').textContent).toBe('subfolder');
	expect(getByTestId('path-segment-2').textContent).toBe('item');
	expect(queryByTestId('path-segment-3')).toBeNull();
});

it('renders component with empty pathSegments', () => {
	const { container } = render(PathBreadcrumb, {
		pathSegments: []
	});
	expect(container).toBeTruthy();
});
