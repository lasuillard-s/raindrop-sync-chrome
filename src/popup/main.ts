import browserPolyfill from 'webextension-polyfill';
import { mount } from 'svelte';
import '~/app.css';
import App from './App.svelte';

globalThis.browser = browserPolyfill as unknown as typeof browser;

const app = mount(App, {
	target: document.getElementById('app') as HTMLElement
});

export default app;
