<script lang="ts">
	import { TabItem, Tabs } from 'flowbite-svelte';
	import {
		BookmarkOutline,
		LinkOutline,
		QuestionCircleOutline,
		SearchOutline
	} from 'flowbite-svelte-icons';
	import '~/app.css';
	import Message from '~/components/Message.svelte';
	import { messageBox } from '~/lib/messages';
	import About from './tabs/About.svelte';
	import Bookmarks from './tabs/Bookmarks.svelte';
	import Integration from './tabs/Integration.svelte';
	import TryIt from './tabs/TryIt.svelte';
</script>

<main class="mx-1 mt-4 self-center">
	<Tabs style="underline">
		<TabItem open>
			{#snippet titleSlot()}
				<div class="flex items-center gap-2">
					<BookmarkOutline size="sm" class="focus:outline-hidden" />
					Bookmarks
				</div>
			{/snippet}
			<Bookmarks />
		</TabItem>
		<TabItem>
			{#snippet titleSlot()}
				<div class="flex items-center gap-2">
					<SearchOutline size="sm" class="focus:outline-hidden" />
					Try It
				</div>
			{/snippet}
			<TryIt />
		</TabItem>
		<TabItem>
			{#snippet titleSlot()}
				<div class="flex items-center gap-2">
					<LinkOutline size="sm" class="focus:outline-hidden" />
					Integration
				</div>
			{/snippet}
			<Integration />
		</TabItem>
		<TabItem>
			{#snippet titleSlot()}
				<div class="flex items-center gap-2">
					<QuestionCircleOutline size="sm" class="focus:outline-hidden" />
					About
				</div>
			{/snippet}
			<About />
		</TabItem>
	</Tabs>

	<!-- Global message box -->
	<div class="fixed top-6 right-6 space-y-2">
		{#each Object.entries($messageBox) as [id, message] (id)}
			<Message {message} />
		{/each}
	</div>
</main>

<style lang="postcss">
	@reference '../app.css';

	:root {
		@apply mx-4 my-2 bg-slate-50;
	}
</style>
