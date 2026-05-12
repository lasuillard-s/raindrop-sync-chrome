import { WebExtensionAlarmService, type AlarmService } from './alarm';
import { WebExtensionBookmarkService, type BookmarkService } from './bookmark';
import { WebExtensionIdentityService, type IdentityService } from './identity';
import { WebExtensionManagementService, type ManagementService } from './management';
import { WebExtensionRuntimeService, type RuntimeService } from './runtime';
import { WebExtensionStorageService, type StorageService } from './storage';

export interface BrowserProxy {
	alarms: AlarmService;
	storage: StorageService;
	runtime: RuntimeService;
	bookmarks: BookmarkService;
	identity: IdentityService;
	management: ManagementService;
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
