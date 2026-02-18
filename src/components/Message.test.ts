// @vitest-environment happy-dom
import { render } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import type { Message as MessageItem } from '~/lib/messages';
import Message from './Message.svelte';

it('renders Message component without any properties', () => {
	const { container } = render(Message);
	expect(container).toBeTruthy();
});

it('renders Message component with a message property', () => {
	const message: MessageItem = {
		type: 'info',
		message: 'This is an info message.'
	};
	const { getByText } = render(Message, { props: { message } });
	expect(getByText('This is an info message.')).toBeTruthy();
});
