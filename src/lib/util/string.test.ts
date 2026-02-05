import { describe, expect, it } from 'vitest';
import { normalizeUrl } from './string';

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
