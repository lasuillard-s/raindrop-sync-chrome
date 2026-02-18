import { describe, expect, it } from 'vitest';
import { normalizeUrl, urlSafeHref } from './string';

describe('normalizeUrl', () => {
	it('trims whitespace from the URL', () => {
		const url = '   http://example.com/path/   ';
		const normalized = normalizeUrl(url);
		expect(normalized).toBe('http:\\/\\/example.com\\/path');
	});

	it('removes trailing slashes', () => {
		const url = 'http://example.com/path/';
		const normalized = normalizeUrl(url);
		expect(normalized).toBe('http:\\/\\/example.com\\/path');
	});

	it('escapes backslashes', () => {
		const url = 'http://example.com\\path\\to\\resource';
		const normalized = normalizeUrl(url);
		expect(normalized).toBe('http:\\/\\/example.com\\\\path\\\\to\\\\resource');
	});

	it('escapes slashes', () => {
		const url = 'http://example.com/path/to/resource';
		const normalized = normalizeUrl(url);
		expect(normalized).toBe('http:\\/\\/example.com\\/path\\/to\\/resource');
	});

	it('handles complex URLs correctly', () => {
		const url = '   http://example.com/path/to/resource/with\\backslashes/   ';
		const normalized = normalizeUrl(url);
		expect(normalized).toBe('http:\\/\\/example.com\\/path\\/to\\/resource\\/with\\\\backslashes');
	});
});

describe('urlSafeHref', () => {
	it('returns the URL if it starts with http://', () => {
		const url = 'http://example.com';
		const safeUrl = urlSafeHref(url);
		expect(safeUrl).toBe(url);
	});

	it('returns the URL if it starts with https://', () => {
		const url = 'https://example.com';
		const safeUrl = urlSafeHref(url);
		expect(safeUrl).toBe(url);
	});

	it.each`
		href
		${'ftp://example.com'}
		${'file://localfile.txt'}
		${'javascript:alert("XSS")'}
		${'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='}
	`('returns an empty string for unsafe URLs', ({ href }) => {
		const safeUrl = urlSafeHref(href);
		expect(safeUrl).toBe('');
	});

	it('handles empty string input', () => {
		const url = '';
		const safeUrl = urlSafeHref(url);
		expect(safeUrl).toBe('');
	});
});
