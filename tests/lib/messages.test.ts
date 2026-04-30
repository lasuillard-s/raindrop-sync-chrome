import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { dismissMessage, messageBox, putMessage } from '~/lib/messages';

describe('messageBox', () => {
	beforeEach(() => {
		messageBox.set({});
	});

	it('stores messages and returns explicit id when provided', () => {
		const id = putMessage({
			id: 'fixed-id',
			type: 'success',
			message: 'Saved'
		});

		expect(id).toBe('fixed-id');
		expect(get(messageBox)).toEqual({
			'fixed-id': {
				id: 'fixed-id',
				type: 'success',
				message: 'Saved'
			}
		});
	});

	it('generates id when not provided and dismisses by id', () => {
		const id = putMessage({
			type: 'info',
			message: 'Running sync'
		});

		expect(id).not.toBe('');
		expect(get(messageBox)[id]).toEqual({
			id,
			type: 'info',
			message: 'Running sync'
		});

		dismissMessage(id);
		expect(get(messageBox)[id]).toBeUndefined();
	});

	it('ignores dismiss requests without id', () => {
		putMessage({ id: 'keep', type: 'error', message: 'Oops' });

		dismissMessage(undefined);

		expect(get(messageBox)).toEqual({
			keep: {
				id: 'keep',
				type: 'error',
				message: 'Oops'
			}
		});
	});
});
