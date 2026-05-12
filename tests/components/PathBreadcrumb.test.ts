// @vitest-environment happy-dom
import { render } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import PathBreadcrumb from '~/components/PathBreadcrumb.svelte';

it('renders with pathSegments', async () => {
	const { getByTestId, queryByTestId } = render(PathBreadcrumb, {
		props: {
			pathSegments: ['folder', 'subfolder', 'item']
		}
	});
	expect(getByTestId('path-segment-0').textContent).toBe('folder');
	expect(getByTestId('path-segment-1').textContent).toBe('subfolder');
	expect(getByTestId('path-segment-2').textContent).toBe('item');
	expect(queryByTestId('path-segment-3')).toBeNull();
});

it('renders with empty pathSegments', () => {
	const { container } = render(PathBreadcrumb, {
		props: {
			pathSegments: []
		}
	});
	expect(container).toBeTruthy();
});
