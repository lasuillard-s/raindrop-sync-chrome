<script lang="ts">
	import { A, P } from 'flowbite-svelte';
	import viteLogo from '~/assets/vite.svg';

	const openOptionsPage = () => chrome.runtime.openOptionsPage();
</script>

<main class="mx-1 my-3 flex w-64 flex-col">
	<P class="text-center text-lg font-semibold">Raindrop Sync for Chrome</P>
	<div class="h-64 w-full">
		<!-- TODO: Sync button with icon -->
		<a href="https://vite.dev" target="_blank">
			<img src={viteLogo} class="logo" alt="Vite logo" />
		</a>
	</div>
	<div class="mt-2 flex justify-end">
		<A onclick={openOptionsPage}>Options</A>
	</div>
</main>

<style lang="postcss">
	@reference '../app.css';

	:root {
		@apply mx-2 my-1 bg-slate-50;
	}
</style>
