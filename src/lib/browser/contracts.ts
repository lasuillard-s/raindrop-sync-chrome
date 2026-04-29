export interface AlarmService {
	clearAll(): Promise<void>;
	create(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void>;
	onAlarmAddListener(listener: (alarm: chrome.alarms.Alarm) => void | Promise<void>): void;
}

export interface StorageService {
	getSyncRaw(key: string): Promise<unknown>;
}

export interface RuntimeService {
	onInstalledAddListener(
		listener: (details: chrome.runtime.InstalledDetails) => void | Promise<void>
	): void;
	getId(): string;
	getManifest(): chrome.runtime.Manifest;
	openOptionsPage(): Promise<void>;
	getOnInstalledReason(): typeof chrome.runtime.OnInstalledReason;
}

export interface BookmarkService {
	getTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]>;
	getSubTree(id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]>;
	create(bookmark: chrome.bookmarks.CreateDetails): Promise<chrome.bookmarks.BookmarkTreeNode>;
	remove(id: string): Promise<void>;
	removeTree(id: string): Promise<void>;
	update(
		id: string,
		changes: chrome.bookmarks.UpdateChanges
	): Promise<chrome.bookmarks.BookmarkTreeNode>;
	move(
		id: string,
		changes: chrome.bookmarks.MoveDestination
	): Promise<chrome.bookmarks.BookmarkTreeNode>;
}

export interface IdentityService {
	getRedirectURL(path?: string): string;
	launchWebAuthFlow(details: chrome.identity.WebAuthFlowDetails): Promise<string | undefined>;
}

export interface ManagementService {
	getSelf(): Promise<chrome.management.ExtensionInfo>;
}

export interface BrowserProxy {
	alarms: AlarmService;
	storage: StorageService;
	runtime: RuntimeService;
	bookmarks: BookmarkService;
	identity: IdentityService;
	management: ManagementService;
}
