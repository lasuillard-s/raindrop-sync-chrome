import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import jsdoc from 'eslint-plugin-jsdoc';
import svelte from 'eslint-plugin-svelte';
import { includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath, { gitignoreResolution: true }),
	js.configs.recommended,
	...ts.configs.recommended,
	prettier,
	...svelte.configs.recommended,
	jsdoc.configs['flat/recommended-typescript'],
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node, browser: 'readonly' }
		}
	},
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
