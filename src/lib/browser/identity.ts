export interface IdentityService {
	getRedirectURL(path?: string): string;
	launchWebAuthFlow(details: chrome.identity.WebAuthFlowDetails): Promise<string | undefined>;
}

export class WebExtensionIdentityService implements IdentityService {
	getRedirectURL(path?: string): string {
		return chrome.identity.getRedirectURL(path);
	}

	async launchWebAuthFlow(
		details: chrome.identity.WebAuthFlowDetails
	): Promise<string | undefined> {
		return await chrome.identity.launchWebAuthFlow(details);
	}
}
