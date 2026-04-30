import type { Page, Worker } from '@playwright/test';

const APP_SETTINGS_STORAGE_KEY = 'appSettings';

type AppSettings = Record<string, unknown>;

export class ExtensionPagesFixture {
	public constructor(private readonly extensionId: string) {}

	public optionsUrl(): string {
		return `chrome-extension://${this.extensionId}/src/options/index.html`;
	}

	public popupUrl(): string {
		return `chrome-extension://${this.extensionId}/src/popup/index.html`;
	}

	public async gotoOptionsPage(page: Page): Promise<void> {
		await page.goto(this.optionsUrl());
		await page.waitForLoadState('domcontentloaded');
	}

	public async gotoPopupPage(page: Page): Promise<void> {
		await page.goto(this.popupUrl());
		await page.waitForLoadState('domcontentloaded');
	}
}

export class ExtensionStorageFixture {
	public constructor(private readonly serviceWorker: Worker) {}

	public async clearAppSettings(): Promise<void> {
		await this.serviceWorker.evaluate(async (storageKey) => {
			await chrome.storage.sync.remove(storageKey);
		}, APP_SETTINGS_STORAGE_KEY);
	}

	public async getAppSettings(): Promise<AppSettings | null> {
		return await this.serviceWorker.evaluate(async (storageKey) => {
			const stored = await chrome.storage.sync.get(storageKey);
			const raw = stored[storageKey];
			if (raw === undefined) {
				return null;
			}
			if (typeof raw === 'string') {
				return JSON.parse(raw) as AppSettings;
			}
			return raw as AppSettings;
		}, APP_SETTINGS_STORAGE_KEY);
	}

	public async setAppSettings(patch: AppSettings): Promise<void> {
		await this.serviceWorker.evaluate(
			async ({ storageKey, nextPatch }) => {
				const stored = await chrome.storage.sync.get(storageKey);
				const currentRaw = stored[storageKey];
				const current =
					typeof currentRaw === 'string'
						? (JSON.parse(currentRaw) as AppSettings)
						: ((currentRaw as AppSettings | undefined) ?? {});
				const merged = {
					...current,
					...nextPatch
				};
				await chrome.storage.sync.set({
					[storageKey]: JSON.stringify(merged)
				});
			},
			{ storageKey: APP_SETTINGS_STORAGE_KEY, nextPatch: patch }
		);
	}
}

export class BookmarkFixture {
	public constructor(private readonly serviceWorker: Worker) {}

	public async createFolder(args: {
		title: string;
		parentId?: string;
	}): Promise<chrome.bookmarks.BookmarkTreeNode> {
		return await this.serviceWorker.evaluate(async (createArgs) => {
			return await chrome.bookmarks.create({
				title: createArgs.title,
				parentId: createArgs.parentId
			});
		}, args);
	}

	public async findFolderByTitle(title: string): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
		return await this.serviceWorker.evaluate(async (folderTitle) => {
			const [root] = await chrome.bookmarks.getTree();
			const queue = [...(root?.children ?? [])];
			while (queue.length > 0) {
				const node = queue.shift()!;
				if (node.url === undefined && node.title === folderTitle) {
					return node;
				}
				queue.push(...(node.children ?? []));
			}
			return null;
		}, title);
	}

	public async getTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
		return await this.serviceWorker.evaluate(async () => {
			return await chrome.bookmarks.getTree();
		});
	}

	public async removeTree(id: string): Promise<void> {
		await this.serviceWorker.evaluate(async (nodeId) => {
			await chrome.bookmarks.removeTree(nodeId);
		}, id);
	}
}
