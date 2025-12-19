import type { PlaywrightTestConfig } from '@playwright/test';

const isCI = !!process.env.CI;

export default {
	use: {
		screenshot: isCI ? 'on' : 'only-on-failure',
		video: isCI ? 'on' : 'retain-on-failure',
		trace: isCI ? 'on' : 'on-first-retry'
	},
	testDir: 'e2e',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	reporter: [
		['list'],
		[
			'html',
			{
				open: isCI ? 'never' : 'on-failure',
				host: process.env.CONTAINER ? '0.0.0.0' : '127.0.0.1'
			}
		],
		['junit', { outputFile: 'junit.xml' }]
	],
	timeout: 30 * 1000,
	retries: isCI ? 2 : 0,
	expect: {
		timeout: 5 * 1000,
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.025 // 2.5%
			// ? Perhaps `fullPage` option is not supported here?
		}
	}
} satisfies PlaywrightTestConfig;
