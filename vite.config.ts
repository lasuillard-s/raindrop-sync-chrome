import { codecovVitePlugin } from '@codecov/vite-plugin';
import { crx } from '@crxjs/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import zip from 'vite-plugin-zip-pack';
import { defineConfig } from 'vitest/config';
import manifest from './manifest.config';
import { name, version } from './package.json';

export default defineConfig(({ mode }) => {
	const plugins = [
		tailwindcss(),
		svelte({
			compilerOptions: {
				dev: mode === 'development',
				runes: true
			}
		})
	] as any[];

	// Only load build-specific plugins when not in test mode
	// Otherwise it make the test runner to run 4(!) times
	if (mode !== 'test') {
		plugins.push(
			crx({ manifest }),
			zip({ outDir: 'release', outFileName: `crx-${name}-${version}.zip` }),
			codecovVitePlugin({
				enableBundleAnalysis: true,
				bundleName: 'raindrop-sync-chrome',
				oidc: {
					useGitHubOIDC: true
				},
				telemetry: false
			})
		);
	}

	return {
		plugins,
		resolve: {
			conditions: mode === 'test' ? ['browser'] : undefined,
			alias: [
				{ find: '$app.css', replacement: path.resolve(__dirname, 'src/app.css') },
				{ find: '$app', replacement: path.resolve(__dirname, 'src/app.ts') },
				{ find: '$assets', replacement: path.resolve(__dirname, 'src/assets') },
				{ find: '$components', replacement: path.resolve(__dirname, 'src/components') },
				{ find: '$config', replacement: path.resolve(__dirname, 'src/config') },
				{ find: '$migrations', replacement: path.resolve(__dirname, 'src/migrations') },
				{ find: '$services', replacement: path.resolve(__dirname, 'src/services') },
				{ find: '$lib', replacement: path.resolve(__dirname, 'src/lib') },
				{ find: '$fixtures', replacement: path.resolve(__dirname, 'tests/fixtures') },
				{ find: '$test-helpers', replacement: path.resolve(__dirname, 'tests/helpers') }
			]
		},
		server: {
			cors: {
				origin: /chrome-extension:\/\//
			},
			hmr: { port: 5173 }
		},
		test: {
			expect: { requireAssertions: true },
			include: ['tests/**/*.{test,spec}.{js,ts}'],
			reporters: ['junit', 'default'],
			outputFile: {
				junit: './junit.xml'
			},
			coverage: {
				enabled: true,
				include: ['src/**'],
				exclude: [
					'tests/**/*.{test,spec}.ts',
					// Not source files
					'src/**/*.d.ts',
					'src/assets/*',
					// Below handled in E2E tests
					'src/service-worker.ts',
					'src/options/*',
					'src/popup/*'
				],
				reporter: ['text', 'clover', 'html']
			},
			setupFiles: ['./tests/setup.ts']
		}
	};
});
