import { errorToString, isUrlSafeHref, normalizeUrl } from '$lib/util/string';
import { describe, expect, it } from 'vitest';

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

describe('isUrlSafeHref', () => {
	it('returns true if the URL starts with http://', () => {
		const url = 'http://example.com';
		const safeUrl = isUrlSafeHref(url);
		expect(safeUrl).toBe(true);
	});

	it('returns true if the URL starts with https://', () => {
		const url = 'https://example.com';
		const safeUrl = isUrlSafeHref(url);
		expect(safeUrl).toBe(true);
	});

	it.each`
		href
		${'ftp://example.com'}
		${'file://localfile.txt'}
		${'javascript:alert("XSS")'}
		${'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='}
	`('returns false for unsafe URLs', ({ href }) => {
		const safeUrl = isUrlSafeHref(href);
		expect(safeUrl).toBe(false);
	});

	it('handles empty string input', () => {
		const url = '';
		const safeUrl = isUrlSafeHref(url);
		expect(safeUrl).toBe(false);
	});
});

describe('errorToString', () => {
	it('returns the message of an Error object', () => {
		const error = new Error('Something went wrong');
		const message = errorToString(error);
		expect(message).toBe('Something went wrong');
	});

	it('returns a string representation for non-Error objects', () => {
		const error = { code: 500, message: 'Internal Server Error' };
		const message = errorToString(error);
		expect(message).toBe('[object Object]');
	});

	it('returns a string representation for primitive values', () => {
		const error = 'A simple error message';
		const message = errorToString(error);
		expect(message).toBe('A simple error message');
	});
});
