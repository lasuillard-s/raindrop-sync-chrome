<script lang="ts">
	import { A, P } from 'flowbite-svelte';

	const getSelf = () => chrome.management.getSelf();
</script>

<div>
	{#await getSelf() then self}
		<P class="mb-2 font-bold" size="xl" color="text-gray-600">{self.name}</P>
		<P class="mb-4 ml-1" size="lg" color="text-gray-400">v{self.version}</P>
		<A href={self.homepageUrl} target="_blank">Homepage</A>
	{/await}
</div>
