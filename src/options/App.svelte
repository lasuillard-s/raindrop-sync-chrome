<script lang="ts">
	import { messageBox } from '$lib/messages';
	import { TabItem, Tabs } from 'flowbite-svelte';
	import {
		BookmarkOutline,
		LinkOutline,
		QuestionCircleOutline,
		SearchOutline
	} from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import '~/app.css';
	import Message from '~/components/Message.svelte';
	import About from './tabs/About.svelte';
	import Bookmarks from './tabs/Bookmarks.svelte';
	import { OptionsTab, optionTabKeys } from './tabs/enums';
	import Integration from './tabs/Integration.svelte';
	import TryIt from './tabs/TryIt.svelte';

	const DEFAULT_TAB = OptionsTab.Bookmarks;

	/**
	 * Check whether a string matches a supported options tab.
	 * @param tabKey Candidate tab key.
	 * @returns True when the value maps to a known options tab.
	 */
	function isOptionsTab(tabKey: string): tabKey is OptionsTab {
		return optionTabKeys.some((supportedTabKey) => supportedTabKey === tabKey);
	}

	/**
	 * Normalize a URL hash to a supported options tab key.
	 * @param hash URL fragment from the current options page location.
	 * @returns The matching tab key, or the default tab when the hash is unknown.
	 */
	function resolveTabFromHash(hash: string): OptionsTab {
		const normalizedHash = hash.replace(/^#/, '');
		return isOptionsTab(normalizedHash) ? normalizedHash : DEFAULT_TAB;
	}

	let selectedTab = $state<OptionsTab>(resolveTabFromHash(window.location.hash));

	$effect(() => {
		const nextHash = `#${selectedTab}`;
		if (window.location.hash !== nextHash) {
			window.location.hash = nextHash;
		}
	});

	onMount(() => {
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
		<TabItem key={OptionsTab.Bookmarks}>
			{#snippet titleSlot()}
				<div class="flex items-center gap-2">
					<BookmarkOutline size="sm" class="focus:outline-hidden" />
					Bookmarks
				</div>
			{/snippet}
			<Bookmarks />
		</TabItem>
		<TabItem key={OptionsTab.TryIt}>
			{#snippet titleSlot()}
				<div class="flex items-center gap-2">
					<SearchOutline size="sm" class="focus:outline-hidden" />
					Try It
				</div>
			{/snippet}
			<TryIt />
		</TabItem>
		<TabItem key={OptionsTab.Integration}>
			{#snippet titleSlot()}
				<div class="flex items-center gap-2">
					<LinkOutline size="sm" class="focus:outline-hidden" />
					Integration
				</div>
			{/snippet}
			<Integration />
		</TabItem>
		<TabItem key={OptionsTab.About}>
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
