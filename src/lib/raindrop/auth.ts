import { generated } from '@lasuillard/raindrop-client';
import { Raindrop } from './client';

export interface AuthFlowParams {
	clientID: string;
	clientSecret: string;
}

export type AuthFlowResponse = {
	accessToken: string;
	refreshToken: string;
	expiresIn: Date;
	tokenType: 'Bearer';
};

/**
 * Initiate OAuth2 Authorization Code Flow for Raindrop API.
 * @param params Auth flow credentials.
 * @param raindrop Raindrop API client.
 * @returns Response body.
 */
export async function launchWebAuthFlow(
	params: AuthFlowParams,
	raindrop?: Raindrop
): Promise<AuthFlowResponse> {
	const rd = raindrop ?? new Raindrop();

	// NOTE: `url` includes credentials; DO NOT print
	const redirectURL = chrome.identity.getRedirectURL();

	// Build auth flow URL
	const authURL = new URL('https://api.raindrop.io/v1/oauth/authorize');
	authURL.searchParams.set('client_id', params.clientID);
	authURL.searchParams.set('redirect_uri', redirectURL);

	// Initiate auth flow
	console.debug(`Launching web auth flow with with redirectURL "${redirectURL}"`);
	const responseURL = await chrome.identity.launchWebAuthFlow({
		url: authURL.toString(),
		interactive: true
	});
	if (!responseURL) {
		throw new Error('web auth flow error: `responseURL` is empty');
	}
	console.debug(`Got redirection to ${responseURL}`);
	const url = new URL(responseURL);

	// Take out `code` from response URL
	const code = url.searchParams.get('code');
	if (!code) {
		throw new Error('Authorization code not found in URL params');
	}

	// Request access token
	const { data } = await rd.auth.exchangeToken({
		client_id: params.clientID,
		client_secret: params.clientSecret,
		redirect_uri: redirectURL,
		code
	});
	const {
		access_token: accessToken,
		refresh_token: refreshToken,
		expires_in,
		token_type: tokenType
	} = data as generated.TokenResponse;

	const expiresIn = new Date();
	expiresIn.setSeconds(expiresIn.getSeconds() + expires_in);

	console.debug(
		`Exchanged code for auth tokens, token type is "${tokenType}" and will expire in ${expiresIn}`
	);

	return { accessToken, refreshToken, expiresIn, tokenType };
}
