import type { Page } from '@playwright/test';

export class GotoFixture {
	constructor(private readonly extensionId: string) {}

	async options(page: Page, tab?: string): Promise<void> {
		await page.goto(`chrome-extension://${this.extensionId}/src/options/index.html`, {
			waitUntil: 'load'
		});
		if (tab) {
			await page.getByRole('tab', { name: tab }).click({ force: true });
		}
	}

	async popup(page: Page): Promise<void> {
		await page.goto(`chrome-extension://${this.extensionId}/src/popup/index.html`, {
			waitUntil: 'load'
		});
	}
}
