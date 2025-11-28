import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { accessToken, clientID, clientSecret, refreshToken } from './settings';

describe('clientID', () => {
	it('should have an empty string as initial value', () => {
		const ival = get(clientID);
		expect(ival).toEqual('');
	});
});

describe('clientSecret', () => {
	it('should have an empty string as initial value', () => {
		const ival = get(clientSecret);
		expect(ival).toEqual('');
	});
});

describe('accessToken', () => {
	it('should have an empty string as initial value', () => {
		const ival = get(accessToken);
		expect(ival).toEqual('');
	});
});

describe('refreshToken', () => {
	it('should have an empty string as initial value', () => {
		const ival = get(refreshToken);
		expect(ival).toEqual('');
	});
});
