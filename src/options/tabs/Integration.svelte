<script lang="ts">
	import { Button, Heading, P } from 'flowbite-svelte';
	import { get } from 'svelte/store';
	import SecretInput from '~/components/SecretInput.svelte';
	import { appSettings } from '~/config';
	import { putMessage } from '~/lib/messages';
	import { launchWebAuthFlow as _launchWebAuthFlow } from '~/lib/raindrop/auth';

	// Create reactive bindings to stores
	let clientID = $state(get(appSettings.clientID));
	let clientSecret = $state(get(appSettings.clientSecret));
	let accessToken = $state(get(appSettings.accessToken));
	let refreshToken = $state(get(appSettings.refreshToken));

	// Keep local state in sync with stores
	$effect(() => {
		const unsubscribeClientID = appSettings.clientID.subscribe((value) => {
			clientID = value;
		});
		return unsubscribeClientID;
	});
	$effect(() => {
		const unsubscribeClientSecret = appSettings.clientSecret.subscribe((value) => {
			clientSecret = value;
		});
		return unsubscribeClientSecret;
	});
	$effect(() => {
		const unsubscribeAccessToken = appSettings.accessToken.subscribe((value) => {
			accessToken = value;
		});
		return unsubscribeAccessToken;
	});
	$effect(() => {
		const unsubscribeRefreshToken = appSettings.refreshToken.subscribe((value) => {
			refreshToken = value;
		});
		return unsubscribeRefreshToken;
	});

	const launchWebAuthFlow = async () => {
		try {
			const result = await _launchWebAuthFlow({
				clientID,
				clientSecret
			});
			await appSettings.accessToken.set(result.accessToken);
			await appSettings.refreshToken.set(result.refreshToken);
			putMessage({ type: 'success', message: 'Successfully authorized app.' });
		} catch (err) {
			console.error('Failed to authorize app:', err);
			putMessage({ type: 'error', message: String(err) });
		}
	};

	const save = async () => {
		await appSettings.clientID.set(clientID);
		await appSettings.clientSecret.set(clientSecret);
		await appSettings.accessToken.set(accessToken);
		await appSettings.refreshToken.set(refreshToken);
		putMessage({ type: 'success', message: 'Settings saved.' });
	};
</script>

<div>
	<div class="space-y-6">
		<!-- API Credentials Section -->
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div class="mb-6 border-b border-gray-200 pb-4">
				<Heading tag="h4" class="text-xl font-bold text-gray-900">Raindrop.io Integration</Heading>
				<P class="mt-2 text-sm text-gray-600">Connect your Raindrop.io account to sync bookmarks</P>
			</div>

			<!-- OAuth Credentials -->
			<div class="mb-6">
				<div class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
					<P class="mb-2 text-sm font-semibold text-blue-900">🔐 OAuth Application</P>
					<P class="mb-3 text-xs text-blue-700">
						Register your application with Raindrop.io to get started. You'll need to create an
						OAuth application at
						<a
							href="https://app.raindrop.io/settings/integrations"
							target="_blank"
							class="font-medium underline hover:text-blue-800"
						>
							Raindrop.io Settings
						</a>
					</P>
					<div class="space-y-3">
						<SecretInput bind:value={clientID}>
							<span class="text-sm font-medium">Client ID</span>
						</SecretInput>
						<SecretInput bind:value={clientSecret}>
							<span class="text-sm font-medium">Client Secret</span>
						</SecretInput>
					</div>
					<div class="mt-4 flex justify-end">
						<Button outline onclick={launchWebAuthFlow} class="px-6">
							🔗 Authorize with Raindrop.io
						</Button>
					</div>
				</div>
			</div>

			<!-- Access Tokens -->
			<div class="mb-6">
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<P class="mb-2 text-sm font-semibold text-gray-700">🎫 Access Tokens</P>
					<P class="mb-3 text-xs text-gray-600">
						Tokens are automatically generated after authorization. For testing, you can also use a
						test token from your Raindrop.io account settings.
					</P>
					<div class="space-y-3">
						<SecretInput bind:value={accessToken}>
							<span class="text-sm font-medium">Access Token</span>
						</SecretInput>
						<SecretInput bind:value={refreshToken}>
							<span class="text-sm font-medium">Refresh Token</span>
						</SecretInput>
					</div>
				</div>
			</div>

			<!-- Save Button -->
			<div class="flex justify-end border-t border-gray-200 pt-4">
				<Button outline onclick={save} class="px-6">Save Credentials</Button>
			</div>
		</div>

		<!-- TODO: Debug actions: check token validity, force refresh token, etc. -->
	</div>
</div>
