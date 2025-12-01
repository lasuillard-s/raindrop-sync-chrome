import { client, generated } from '@lasuillard/raindrop-client';
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
// import { setupCache } from 'axios-cache-interceptor';
import { get } from 'svelte/store';
import appSettings from '~/lib/settings';

/**
 * Get Raindrop client.
 * @param configuration Raindrop API configuration.
 * @param axiosClient Axios client used for Raindrop API client to make requests.
 * @returns New Raindrop client.
 */
export function getClient(
	configuration?: generated.Configuration,
	axiosClient?: AxiosInstance
): client.Raindrop {
	configuration ??= new generated.Configuration();
	axiosClient ??= getAxiosClient();

	return new client.Raindrop(configuration, axiosClient);
}

/// Interface for retry queue items
interface RetryQueueItem {
	resolve: (value?: any) => void;
	reject: (error?: any) => void;
	config: AxiosRequestConfig;
}

// Queue to hold requests that need to be retried after access token refresh
const retryQueue: RetryQueueItem[] = [];

// Flag to indicate if access token is being refreshed
let isRefreshing = false;

/**
 * Create new Axios client with all interceptors & caches are set.
 * @returns New Axios instance.
 */
export function getAxiosClient(): AxiosInstance {
	const instance = axios.create({
		// baseURL: 'https://api.raindrop.io'
	});

	// TODO: Request throttling; https://www.npmjs.com/package/axios-request-throttle
	instance.interceptors.request.use(
		function (config) {
			const accessToken = get(appSettings.accessToken);
			if (accessToken) {
				config.headers.Authorization = `Bearer ${accessToken}`;
			}
			return config;
		},
		function (error: AxiosError) {
			return Promise.reject(error);
		}
	);

	// https://medium.com/@sina.alizadeh120/repeating-failed-requests-after-token-refresh-in-axios-interceptors-for-react-js-apps-50feb54ddcbc
	instance.interceptors.response.use(
		function (response) {
			return response;
		},
		async function (error: AxiosError) {
			console.error('Response error from server:', error.response?.status);

			// @ts-expect-error Ignore TS error for now
			const originalRequest: AxiosRequestConfig = error.config;
			if (error.response?.status === 401) {
				if (!get(appSettings.refreshToken)) {
					console.error('No refresh token available, cannot refresh access token');
					return Promise.reject(error);
				}

				// TODO: It does enqueue requests AFTER error response from server; it would be better to block requests
				//       until access token is refreshed at the request interceptor level.
				//       But the impact is minor in current implementation, so leaving it as is for now.
				if (isRefreshing) {
					console.debug('Access token is being refreshed, adding request to retry queue');
					return new Promise<void>((resolve, reject) => {
						retryQueue.push({ resolve, reject, config: originalRequest });
					});
				}

				console.debug('Refreshing access token');
				const client = getClient(undefined, instance);
				isRefreshing = true;
				try {
					await tryRefreshAccessToken(client);
					// ? Not awaited it for reason -- don't care; fire-and-forget
					retryAllRequests(instance);
				} catch (refreshError) {
					// ? Not awaited it for reason -- don't care; fire-and-forget
					rejectAllRequests();
					throw refreshError;
				} finally {
					isRefreshing = false;
				}

				// Retry the original request...
				return instance(originalRequest);
			}
			return Promise.reject(error);
		}
	);

	// TODO: Disabled premature cache setup for now for debugging purpose
	// setupCache(instance);

	return instance;
}

// TODO: Consider refactoring token management with FSM
/**
 * Try to get new access token using refresh token.
 * If successful, updates access token in settings. Otherwise, clears tokens.
 * @param client Raindrop client to use for the request.
 * @returns New access token if successful.
 */
async function tryRefreshAccessToken(client: client.Raindrop): Promise<string> {
	try {
		console.debug('Requesting new access token using refresh token');
		const response = await client.auth.refreshToken({
			client_id: get(appSettings.clientID),
			client_secret: get(appSettings.clientSecret),
			refresh_token: get(appSettings.refreshToken)
		});
		const newAccessToken = response.data.access_token;

		console.debug('Updating access token in settings');
		await appSettings.accessToken.set(newAccessToken);

		return newAccessToken;
	} catch (err) {
		console.debug('Failed to refresh access token, clearing tokens in settings');
		await appSettings.accessToken.set('');
		await appSettings.refreshToken.set('');

		throw new Error(`Failed to refresh access token: ${err}`);
	}
}

/**
 * Retry all requests in the retry queue.
 * @param instance Axios instance to use for the requests.
 */
async function retryAllRequests(instance: AxiosInstance): Promise<void> {
	if (retryQueue.length === 0) {
		console.debug('No requests to retry');
		return;
	}

	console.debug(`Retrying ${retryQueue.length} requests in queue`);
	while (retryQueue.length > 0) {
		const queueItem = retryQueue.shift();
		if (!queueItem) {
			continue;
		}
		const { config, resolve, reject } = queueItem;
		instance(config).then(resolve).catch(reject);
	}
	console.debug('All queued requests retried');
}

/**
 * Reject all queued requests in the retry queue.
 */
async function rejectAllRequests(): Promise<void> {
	if (retryQueue.length === 0) {
		console.debug('No requests to reject');
		return;
	}

	console.debug(`Rejecting ${retryQueue.length} requests in queue`);
	while (retryQueue.length > 0) {
		const queueItem = retryQueue.shift();
		if (!queueItem) {
			continue;
		}
		const { reject } = queueItem;
		reject(new Error('Request failed after token refresh'));
	}
	console.debug('All queued requests rejected');
}
