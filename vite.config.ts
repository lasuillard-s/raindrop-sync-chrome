import { codecovVitePlugin } from '@codecov/vite-plugin';
import { crx } from '@crxjs/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { defineConfig } from 'vitest/config';
import manifest from './src/manifest';

export default defineConfig({
	plugins: [
		tailwindcss(),
		svelte(),
		crx({ manifest }),
		codecovVitePlugin({
			enableBundleAnalysis: true,
			bundleName: 'raindrop-sync-chrome',
			oidc: {
				useGitHubOIDC: true
			}
		})
	] as any,
	resolve: {
		conditions: ['browser'],
		alias: [
			{ find: '~', replacement: path.resolve(__dirname, '/src') },
			{ find: '^', replacement: path.resolve(__dirname, '/') }
		]
	},
	optimizeDeps: {
		esbuildOptions: {
			define: {
				global: 'globalThis'
			}
		}
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			plugins: [nodePolyfills()] as any
		},
		sourcemap: true
	},
	server: {
		port: 5173,
		strictPort: true,
		hmr: { port: 5173 }
	},
	// https://github.com/crxjs/chrome-extension-tools/issues/971
	legacy: {
		skipWebSocketTokenCheck: true
	},
	test: {
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		exclude: ['**/__mocks__/*'],
		reporters: ['junit', 'default'],
		outputFile: {
			junit: './junit.xml'
		},
		coverage: {
			include: ['src/**'],
			exclude: [
				'src/**/__mocks__/*',
				'src/**/*.d.ts',
				'src/**/*.{test,spec}.ts',
				// E2E tests handle these
				'src/manifest.ts',
				'src/service-worker.ts',
				'src/pages/**'
			],
			reporter: ['text', 'clover', 'html']
		},
		setupFiles: ['tests/setup.ts'],
		api: {
			// Publish for * if inside container for forwarding
			host: process.env.CONTAINER ? '0.0.0.0' : '127.0.0.1',
			port: 51204
		},
		css: false
	}
});
