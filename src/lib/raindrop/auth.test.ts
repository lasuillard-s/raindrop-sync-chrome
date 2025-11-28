import { client } from '@lasuillard/raindrop-client';
import chrome from 'sinon-chrome';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { launchWebAuthFlow } from './auth';

const tokenResponse = {
	access_token: '<ACCESS_TOKEN>',
	refresh_token: '<REFRESH_TOKEN>',
	expires: 1209599974,
	expires_in: 1209599,
	token_type: 'Bearer'
};

describe(launchWebAuthFlow, () => {
	const rd = new client.Raindrop();

	beforeEach(() => {
		chrome.identity.getRedirectURL.returns('https://extension-id.chromiumapp.org/');
		chrome.identity.launchWebAuthFlow
			.withArgs({
				url: 'https://api.raindrop.io/v1/oauth/authorize?client_id=client-id&redirect_uri=https%3A%2F%2Fextension-id.chromiumapp.org%2F',
				interactive: true
			})
			.returns('https://extension-id.chromiumapp.org/?code=authorization-code');
	});

	it('conforms to OAuth 2.0 Authorization Code Flow', async () => {
		vi.spyOn(rd.auth, 'exchangeToken').mockReturnValueOnce({
			// @ts-expect-error Enough for mocking
			data: tokenResponse
		});

		const result = await launchWebAuthFlow(
			{
				clientID: 'client-id',
				clientSecret: 'client-secret'
			},
			rd
		);
		expect(result).toEqual({
			accessToken: '<ACCESS_TOKEN>',
			refreshToken: '<REFRESH_TOKEN>',
			expiresIn: expect.any(Date), // It is dynamic; now + `expiresIn` seconds
			tokenType: 'Bearer'
		});
	});

	it('throws an error if `responseURL` not provided', async () => {
		chrome.identity.launchWebAuthFlow
			.withArgs({
				url: 'https://api.raindrop.io/v1/oauth/authorize?client_id=client-id&redirect_uri=https%3A%2F%2Fextension-id.chromiumapp.org%2F',
				interactive: true
			})
			.returns(undefined);

		expect(
			launchWebAuthFlow({
				clientID: 'client-id',
				clientSecret: 'client-secret'
			})
		).rejects.toThrowError('web auth flow error: `responseURL` is empty');
	});

	it('throws an error if `code` not provided', async () => {
		chrome.identity.launchWebAuthFlow
			.withArgs({
				url: 'https://api.raindrop.io/v1/oauth/authorize?client_id=client-id&redirect_uri=https%3A%2F%2Fextension-id.chromiumapp.org%2F',
				interactive: true
			})
			.returns('https://extension-id.chromiumapp.org/?_code=authorization-code');

		expect(
			launchWebAuthFlow({
				clientID: 'client-id',
				clientSecret: 'client-secret'
			})
		).rejects.toThrowError('Authorization code not found in URL params');
	});
});
