<script lang="ts">
	import { messageBox } from '$lib/messages';
	import { TabItem, Tabs } from 'flowbite-svelte';
	import {
		BookmarkOutline,
		LinkOutline,
		QuestionCircleOutline,
		SearchOutline
	} from 'flowbite-svelte-icons';
	import '~/app.css';
	import Message from '~/components/Message.svelte';
	import About from './tabs/About.svelte';
	import Bookmarks from './tabs/Bookmarks.svelte';
	import Integration from './tabs/Integration.svelte';
	import TryIt from './tabs/TryIt.svelte';

	const DEFAULT_TAB = 'bookmarks';
	const optionTabKeys = ['bookmarks', 'try-it', 'integration', 'about'] as const;

	/**
	 * Normalize a URL hash to a supported options tab key.
	 * @param hash URL fragment from the current options page location.
	 * @returns The matching tab key, or the default tab when the hash is unknown.
	 */
	function resolveTabFromHash(hash: string): 'bookmarks' | 'try-it' | 'integration' | 'about' {
		const normalizedHash = hash.replace(/^#/, '');
		return optionTabKeys.find((tabKey) => tabKey === normalizedHash) ?? DEFAULT_TAB;
	}

	/**
	 * Select an options tab and keep the URL fragment in sync.
	 * @param tabKey Supported tab key to activate.
	 */
	function selectTab(tabKey: 'bookmarks' | 'try-it' | 'integration' | 'about') {
		selectedTab = tabKey;

		const nextHash = `#${tabKey}`;
		if (window.location.hash !== nextHash) {
			window.location.hash = nextHash;
		}
	}

	let selectedTab = $state<'bookmarks' | 'try-it' | 'integration' | 'about'>(
		resolveTabFromHash(window.location.hash)
	);

	$effect(() => {
		const syncSelectedTab = () => {
			selectedTab = resolveTabFromHash(window.location.hash);
		};

		if (!window.location.hash) {
			window.location.hash = `#${DEFAULT_TAB}`;
		}
		syncSelectedTab();
		window.addEventListener('hashchange', syncSelectedTab);

		return () => {
			window.removeEventListener('hashchange', syncSelectedTab);
		};
	});
</script>

<main class="mx-4 mt-4 self-center">
	<Tabs style="underline" bind:selected={selectedTab}>
		<TabItem key="bookmarks" onclick={() => selectTab('bookmarks')}>
			{#snippet titleSlot()}
				<div class="flex items-center gap-2">
					<BookmarkOutline size="sm" class="focus:outline-hidden" />
					Bookmarks
				</div>
			{/snippet}
			<Bookmarks />
		</TabItem>
		<TabItem key="try-it" onclick={() => selectTab('try-it')}>
			{#snippet titleSlot()}
				<div class="flex items-center gap-2">
					<SearchOutline size="sm" class="focus:outline-hidden" />
					Try It
				</div>
			{/snippet}
			<TryIt />
		</TabItem>
		<TabItem key="integration" onclick={() => selectTab('integration')}>
			{#snippet titleSlot()}
				<div class="flex items-center gap-2">
					<LinkOutline size="sm" class="focus:outline-hidden" />
					Integration
				</div>
			{/snippet}
			<Integration />
		</TabItem>
		<TabItem key="about" onclick={() => selectTab('about')}>
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
