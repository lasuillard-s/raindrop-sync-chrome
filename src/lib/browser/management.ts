export interface ManagementService {
	getSelf(): Promise<chrome.management.ExtensionInfo>;
}

export class WebExtensionManagementService implements ManagementService {
	async getSelf(): Promise<chrome.management.ExtensionInfo> {
		return await chrome.management.getSelf();
	}
}
