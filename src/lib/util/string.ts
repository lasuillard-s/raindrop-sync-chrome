/**
 * Normalize URL so that various URLs from various sources can be compared.
 *
 * For example, Chrome browser seems to handle redirection, the bookmark's URL
 * can be different from the input used for bookmark creation.
 * @param url URL to normalize
 * @returns Normalized URL
 */
export function normalizeUrl(url: string): string {
	let normalized = url.trim();

	// Remove trailing slash
	normalized = normalized.replace(/\/$/, '');

	// Escape backslashes
	normalized = normalized.replace(/\\/g, '\\\\');

	// Escape slashes
	normalized = normalized.replace(/\//g, '\\/');

	// ... add more processing code here

	return normalized;
}

/**
 * Check if the URL is safe (starts with http:// or https://).
 * @param href URL to check
 * @returns True if the URL is safe, false otherwise
 */
export function isUrlSafeHref(href: string): boolean {
	if (!(href.startsWith('http://') || href.startsWith('https://'))) {
		return false;
	}
	return true;
}
