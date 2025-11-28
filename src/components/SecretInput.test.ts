// @vitest-environment happy-dom
import { render } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import SecretInput from './SecretInput.svelte';

it('renders OK', () => {
	const { container } = render(SecretInput);
	expect(container).toBeTruthy();
});
