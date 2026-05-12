import type { BrowserContext, Route } from '@playwright/test';

type MockCollection = {
	_id: number;
	title: string;
};

type MockRaindrop = {
	_id: number;
	title: string;
	link: string;
	collection: { $id: number };
};

export class RaindropMockerFixture {
	constructor(private readonly context: BrowserContext) {}

	async mockUserUnauthorized(): Promise<void> {
		await this.context.route(`https://api.raindrop.io/rest/v1/**`, async (route: Route) => {
			await route.fulfill({
				status: 401,
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					result: false,
					error: 'Unauthorized',
					errorMessage: 'Unauthorized'
				})
			});
		});
	}

	/**
	 * Install deterministic Raindrop API route mocks for a test.
	 * @param data Mock payloads for collections and raindrops.
	 * @param data.collections Root-level collections payload.
	 * @param data.childCollections Child collections payload.
	 * @param data.raindrops Raindrops payload.
	 */
	async mockBookmarks(data: {
		collections: MockCollection[];
		childCollections?: MockCollection[];
		raindrops: MockRaindrop[];
	}): Promise<void> {
		await this.context.route('https://api.raindrop.io/rest/v1/**', async (route: Route) => {
			const requestUrl = new URL(route.request().url());
			const jsonHeaders = { 'content-type': 'application/json' };

			if (requestUrl.pathname === '/rest/v1/collections') {
				await route.fulfill({
					status: 200,
					headers: jsonHeaders,
					body: JSON.stringify({
						result: true,
						items: data.collections,
						count: data.collections.length
					})
				});
				return;
			}

			if (requestUrl.pathname === '/rest/v1/collections/childrens') {
				const childCollections = data.childCollections ?? [];
				await route.fulfill({
					status: 200,
					headers: jsonHeaders,
					body: JSON.stringify({
						result: true,
						items: childCollections,
						count: childCollections.length
					})
				});
				return;
			}

			if (requestUrl.pathname.startsWith('/rest/v1/raindrops/')) {
				await route.fulfill({
					status: 200,
					headers: jsonHeaders,
					body: JSON.stringify({
						result: true,
						items: data.raindrops,
						count: data.raindrops.length
					})
				});
				return;
			}

			await route.continue();
		});
	}
}
