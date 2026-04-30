import { launchWebAuthFlow } from '@lib/raindrop/auth';
import { Raindrop } from '@lib/raindrop/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const tokenResponse = {
	access_token: '<ACCESS_TOKEN>',
	refresh_token: '<REFRESH_TOKEN>',
	expires: 1209599974,
	expires_in: 1209599,
	token_type: 'Bearer'
};

describe(launchWebAuthFlow, () => {
	const rd = new Raindrop();

	beforeEach(() => {
		vi.mocked(chrome.identity.getRedirectURL).mockReturnValue(
			'https://extension-id.chromiumapp.org/'
		);
		vi.mocked(chrome.identity.launchWebAuthFlow).mockImplementation(async () => {
			return 'https://extension-id.chromiumapp.org/?code=authorization-code';
		});
	});

	it('conforms to OAuth 2.0 Authorization Code Flow', async () => {
		// Arrange
		vi.spyOn(rd.auth, 'exchangeToken').mockReturnValueOnce({
			// @ts-expect-error Enough for mocking
			data: tokenResponse
		});

		// Act
		const result = await launchWebAuthFlow(
			{
				clientID: 'client-id',
				clientSecret: 'client-secret'
			},
			rd
		);

		// Assert
		expect(result).toEqual({
			accessToken: '<ACCESS_TOKEN>',
			refreshToken: '<REFRESH_TOKEN>',
			expiresIn: expect.any(Date), // It is dynamic; now + `expiresIn` seconds
			tokenType: 'Bearer'
		});
	});

	it('throws an error if `responseURL` not provided', async () => {
		// Arrange
		vi.mocked(chrome.identity.launchWebAuthFlow).mockImplementationOnce(async () => {
			return undefined;
		});

		// Act + Assert
		await expect(
			launchWebAuthFlow({
				clientID: 'client-id',
				clientSecret: 'client-secret'
			})
		).rejects.toThrowError('web auth flow error: `responseURL` is empty');
	});

	it('throws an error if `code` not provided', async () => {
		// Arrange
		vi.mocked(chrome.identity.launchWebAuthFlow).mockImplementationOnce(async () => {
			return 'https://extension-id.chromiumapp.org/?_code=authorization-code';
		});

		// Act + Assert
		await expect(
			launchWebAuthFlow({
				clientID: 'client-id',
				clientSecret: 'client-secret'
			})
		).rejects.toThrowError('Authorization code not found in URL params');
	});
});
