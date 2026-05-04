export interface RuntimeService {
	onInstalledAddListener(
		listener: (details: chrome.runtime.InstalledDetails) => void | Promise<void>
	): void;
	getId(): string;
	getManifest(): chrome.runtime.Manifest;
	openOptionsPage(): Promise<void>;
	getOnInstalledReason(): typeof chrome.runtime.OnInstalledReason;
}

export class WebExtensionRuntimeService implements RuntimeService {
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
