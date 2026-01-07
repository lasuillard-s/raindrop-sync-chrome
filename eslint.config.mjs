import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import jsdoc from 'eslint-plugin-jsdoc';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default ts.config(
	{
		ignores: [
			'coverage/*',
			'playwright-report/*',
			'test-results/*',
			'dist/*',
			'.svelte-kit/*',
			'vite.config.{js,ts}.timestamp-*',
			'chrome-dev-profile/*'
		]
	},
	js.configs.recommended,
	...ts.configs.recommended,
	prettier,
	...svelte.configs.recommended,
	jsdoc.configs['flat/recommended-typescript'],
	{ languageOptions: { globals: { ...globals.browser, ...globals.node, chrome: 'readonly' } } },
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{ rules: { '@typescript-eslint/no-explicit-any': 'off' } }
);
