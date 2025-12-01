<script lang="ts">
	import { Button, Heading, P, Radio, Range, Toggle } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import SecretInput from '~/components/SecretInput.svelte';
	import { putMessage } from '~/lib/messages';
	import { launchWebAuthFlow as _launchWebAuthFlow } from '~/lib/raindrop/auth';
	import appSettings, { scheduleAutoSync } from '~/lib/settings';

	const launchWebAuthFlow = async () => {
		try {
			const result = await _launchWebAuthFlow({
				clientID: get(appSettings.clientID),
				clientSecret: get(appSettings.clientSecret)
			});
			await appSettings.accessToken.set(result.accessToken);
			await appSettings.refreshToken.set(result.refreshToken);
			putMessage({ type: 'success', message: 'Successfully authorized app.' });
		} catch (err) {
			console.error('Failed to authorize app:', err);
			putMessage({ type: 'error', message: String(err) });
		}
	};

	let bookmarkFolders: { id: string; title: string; depth: number }[] = [];

	onMount(async () => {
		const bookmarksTree = (await chrome.bookmarks.getTree()) || [];
		if (!bookmarksTree[0]?.children) {
			putMessage({ type: 'error', message: 'No bookmark folders found.' });
			console.error('No bookmark folders found.');
			return;
		}

		const dfs = (arr: chrome.bookmarks.BookmarkTreeNode[], depth: number = 0) => {
			for (const node of arr) {
				if (depth != 0 /* Ignore virtual root */ && node.url === undefined) {
					bookmarkFolders.push({ id: node.id, title: node.title, depth });
				}
				if (node.children) {
					dfs(node.children ?? [], depth + 1);
				}
			}
		};

		dfs(bookmarksTree);

		// Force trigger reactivity
		bookmarkFolders = bookmarkFolders;
	});

	// TODO: Alarms for auto sync should be re-scheduled on changes
	let settingsChange = {
		clientID: get(appSettings.clientID),
		clientSecret: get(appSettings.clientSecret),
		accessToken: get(appSettings.accessToken),
		refreshToken: get(appSettings.refreshToken),
		autoSyncEnabled: get(appSettings.autoSyncEnabled),
		autoSyncExecOnStartup: get(appSettings.autoSyncExecOnStartup),
		autoSyncIntervalInMinutes: get(appSettings.autoSyncIntervalInMinutes),
		syncLocation: get(appSettings.syncLocation)
	};

	const save = async () => {
		console.debug('Saving settings:', settingsChange);
		await appSettings.clientID.set(settingsChange.clientID);
		await appSettings.clientSecret.set(settingsChange.clientSecret);
		await appSettings.accessToken.set(settingsChange.accessToken);
		await appSettings.refreshToken.set(settingsChange.refreshToken);
		await appSettings.autoSyncEnabled.set(settingsChange.autoSyncEnabled);
		await appSettings.autoSyncExecOnStartup.set(settingsChange.autoSyncExecOnStartup);
		await appSettings.autoSyncIntervalInMinutes.set(settingsChange.autoSyncIntervalInMinutes);
		await appSettings.syncLocation.set(settingsChange.syncLocation);
		await scheduleAutoSync();
		putMessage({ type: 'success', message: 'Settings saved.' });
	};
</script>

<div>
	<div class="grid grid-cols-1">
		<Heading tag="h4">Application</Heading>
		<div class="mt-6 grid grid-flow-row grid-cols-1 gap-x-4 gap-y-6">
			<SecretInput bind:value={settingsChange.clientID}>Client ID</SecretInput>
			<SecretInput bind:value={settingsChange.clientSecret}>Client Secret</SecretInput>
			<SecretInput bind:value={settingsChange.accessToken}>Access Token</SecretInput>
			<SecretInput bind:value={settingsChange.refreshToken}>Refresh Token</SecretInput>
			<P>
				<!-- TODO: More detailed guide registering application with pictures -->
				To register your application, fill <b>Client ID</b> and <b>Client Secret</b> then click
				<b>Register</b>. Or, directly fill your test token in <b>Access Token</b> directly.
			</P>
			<Button outline onclick={launchWebAuthFlow}>Register</Button>
		</div>
		<div class="mt-6 grid grid-flow-row grid-cols-1 gap-x-4 gap-y-6">
			<Heading tag="h4">Sync</Heading>
			<!-- TODO: Re-schedule alarm on changes -->
			<Toggle bind:checked={settingsChange.autoSyncEnabled}>AutoSync</Toggle>
			<Toggle bind:checked={settingsChange.autoSyncExecOnStartup}>AutoSync on Startup</Toggle>
			<div>
				<Range bind:value={settingsChange.autoSyncIntervalInMinutes} min="1" max="60" />
				<P size="sm" align="center">
					Sync every {settingsChange.autoSyncIntervalInMinutes} minutes
				</P>
			</div>
			<div>
				<Heading tag="h5">Sync Location</Heading>
				<P color="text-red-700" size="sm">
					Existing bookmarks in sync target folder will be lost each time sync run!
				</P>
				<div class="mt-2">
					{#each bookmarkFolders as bf (bf.id)}
						<div style="margin-left: {6 * 0.25 * (bf.depth - 1)}rem;" class="my-1">
							<Radio name="sync-location" bind:group={settingsChange.syncLocation} value={bf.id}>
								{bf.title}
							</Radio>
						</div>
					{/each}
				</div>
			</div>
		</div>
		<div class="mt-8 grid grid-cols-1 gap-x-4">
			<Button outline onclick={save}>Save</Button>
		</div>
		<!-- TODO: Debug actions: check token validity, force refresh token, etc. -->
	</div>
</div>
