import type {
	AlarmService,
	BookmarkService,
	BrowserProxy,
	IdentityService,
	ManagementService,
	RuntimeService,
	StorageService
} from './contracts';

export type {
	AlarmService,
	BookmarkService,
	BrowserProxy,
	IdentityService,
	ManagementService,
	RuntimeService,
	StorageService
} from './contracts';

class WebExtensionAlarmService implements AlarmService {
	async clearAll(): Promise<void> {
		await chrome.alarms.clearAll();
	}

	async create(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void> {
		await chrome.alarms.create(name, alarmInfo);
	}

	onAlarmAddListener(listener: (alarm: chrome.alarms.Alarm) => void | Promise<void>): void {
		chrome.alarms.onAlarm.addListener(listener);
	}
}

class WebExtensionStorageService implements StorageService {
	async getSyncRaw(key: string): Promise<unknown> {
		const result = await chrome.storage.sync.get(key);
		return result[key];
	}
}

class WebExtensionRuntimeService implements RuntimeService {
	onInstalledAddListener(
		listener: (details: chrome.runtime.InstalledDetails) => void | Promise<void>
	): void {
		chrome.runtime.onInstalled.addListener(listener);
	}

	getId(): string {
		return chrome.runtime.id;
	}

	getManifest(): chrome.runtime.Manifest {
		return chrome.runtime.getManifest();
	}

	async openOptionsPage(): Promise<void> {
		await chrome.runtime.openOptionsPage();
	}

	getOnInstalledReason(): typeof chrome.runtime.OnInstalledReason {
		return chrome.runtime.OnInstalledReason;
	}
}

class WebExtensionBookmarkService implements BookmarkService {
	async getTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
		return await chrome.bookmarks.getTree();
	}

	async getSubTree(id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
		return await chrome.bookmarks.getSubTree(id);
	}

	async create(
		bookmark: chrome.bookmarks.CreateDetails
	): Promise<chrome.bookmarks.BookmarkTreeNode> {
		return await chrome.bookmarks.create(bookmark);
	}

	async remove(id: string): Promise<void> {
		await chrome.bookmarks.remove(id);
	}

	async removeTree(id: string): Promise<void> {
		await chrome.bookmarks.removeTree(id);
	}

	async update(
		id: string,
		changes: chrome.bookmarks.UpdateChanges
	): Promise<chrome.bookmarks.BookmarkTreeNode> {
		return await chrome.bookmarks.update(id, changes);
	}
}

class WebExtensionIdentityService implements IdentityService {
	getRedirectURL(path?: string): string {
		return chrome.identity.getRedirectURL(path);
	}

	async launchWebAuthFlow(
		details: chrome.identity.WebAuthFlowDetails
	): Promise<string | undefined> {
		return await chrome.identity.launchWebAuthFlow(details);
	}
}

class WebExtensionManagementService implements ManagementService {
	async getSelf(): Promise<chrome.management.ExtensionInfo> {
		return await chrome.management.getSelf();
	}
}

export class WebExtensionProxy implements BrowserProxy {
	alarms: AlarmService;
	storage: StorageService;
	runtime: RuntimeService;
	bookmarks: BookmarkService;
	identity: IdentityService;
	management: ManagementService;

	constructor() {
		this.alarms = new WebExtensionAlarmService();
		this.storage = new WebExtensionStorageService();
		this.runtime = new WebExtensionRuntimeService();
		this.bookmarks = new WebExtensionBookmarkService();
		this.identity = new WebExtensionIdentityService();
		this.management = new WebExtensionManagementService();
	}
}

export const defaultBrowserProxy: BrowserProxy = new WebExtensionProxy();
