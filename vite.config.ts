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
				dev: mode === 'development'
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
				{ find: '~', replacement: path.resolve(__dirname, 'src') },
				{ find: '^', replacement: path.resolve(__dirname) },
				{ find: '@fixtures', replacement: path.resolve(__dirname, 'tests/fixtures') },
				{ find: '@test-helpers', replacement: path.resolve(__dirname, 'tests/helpers') }
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
			include: ['src/**/*.{test,spec}.{js,ts}'],
			exclude: ['**/__mocks__/*'],
			reporters: ['junit', 'default'],
			outputFile: {
				junit: './junit.xml'
			},
			coverage: {
				enabled: true,
				include: ['src/**'],
				exclude: [
					'src/**/__mocks__/*',
					'src/**/*.d.ts',
					'src/**/*.{test,spec}.ts',
					'src/assets/*',
					'src/**/index.html'
				],
				reporter: ['text', 'clover', 'html']
			},
			setupFiles: ['./tests/setup.ts']
		}
	};
});
