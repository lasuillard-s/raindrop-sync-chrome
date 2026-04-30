// @vitest-environment happy-dom
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { expect, it } from 'vitest';
import SecretInput from '~/components/SecretInput.svelte';

const labelSnippet = createRawSnippet(() => ({
	render: () => '<span>Secret Label</span>'
}));

it('renders SecretInput component without any properties', () => {
	const { container } = render(SecretInput);
	expect(container).toBeTruthy();
});

it('renders SecretInput component with a label property', () => {
	const { getByText } = render(SecretInput, {
		props: {
			children: labelSnippet
		}
	});
	expect(getByText('Secret Label')).toBeTruthy();
});

it('renders SecretInput component with a value property', async () => {
	// Arrange
	const user = userEvent.setup();
	const { getByLabelText } = render(SecretInput, {
		props: {
			children: labelSnippet,
			value: 'my-secret-value'
		}
	});

	// Act + Assert
	// Verify initial value and type
	const input = getByLabelText('Secret Label') as HTMLInputElement;
	expect(input.type).toBe('password');
	expect(input.value).toBe('my-secret-value');

	// Clear value and type a new one
	input.value = '';
	await user.click(input);
	await user.keyboard('new-secret-value');
	expect(input.value).toBe('new-secret-value');
});

// NOTE: This test can't verify the value is actually "hidden" in component testing
it('toggles secret visibility when button is clicked', async () => {
	// Arrange
	const user = userEvent.setup();
	const { getByLabelText, getByRole } = render(SecretInput, {
		props: {
			children: labelSnippet,
			value: 'my-secret-value'
		}
	});

	const input = getByLabelText('Secret Label') as HTMLInputElement;
	const toggleButton = getByRole('button');

	// Act + Assert
	// Initially, the input type should be 'password'
	expect(input.type).toBe('password');

	// Click the toggle button to show the secret
	await user.click(toggleButton);
	expect(input.type).toBe('text');

	// Click the toggle button again to hide the secret
	await user.click(toggleButton);
	expect(input.type).toBe('password');
});
