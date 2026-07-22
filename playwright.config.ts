import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
	use: {
		screenshot: isCI ? 'on' : 'only-on-failure',
		video: isCI ? 'on' : 'retain-on-failure',
		trace: isCI ? 'on' : 'on-first-retry',
		channel: 'chromium',
		launchOptions: {
			args: [
				'--font-render-hinting=none',
				'--disable-skia-runtime-opts',
				'--disable-font-subpixel-positioning',
				'--disable-lcd-text'
			]
		}
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
	timeout: 30 * 1_000,
	retries: isCI ? 2 : 0,
	expect: {
		timeout: 5 * 1_000,
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.01 // 1%
			// ? Perhaps `fullPage` option is not supported here?
		}
	}
});
