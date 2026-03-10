<script lang="ts">
	import { Accordion, AccordionItem, Button, Heading, P } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import imgCNA1 from '~/assets/raindrop-create-new-app-1.png';
	import imgCNA2 from '~/assets/raindrop-create-new-app-2.png';
	import SecretInput from '~/components/SecretInput.svelte';
	import { SettingsStore } from '~/config';
	import { putMessage } from '~/lib/messages';
	import { launchWebAuthFlow as _launchWebAuthFlow } from '~/lib/raindrop/auth';

	const settings = SettingsStore.getOrCreate();
	const settingsSnapshot = settings.snapshot;

	const extensionId = chrome.runtime.id;
	const extensionDescription = chrome.runtime.getManifest().description;

	// Create reactive bindings from unified settings store
	let clientId = $state(settingsSnapshot.clientId);
	let clientSecret = $state(settingsSnapshot.clientSecret);
	let accessToken = $state(settingsSnapshot.accessToken);
	let refreshToken = $state(settingsSnapshot.refreshToken);

	// Keep local state in sync with unified settings store
	$effect(() => {
		const unsubscribe = settings.$data.subscribe((settings) => {
			clientId = settings.clientId;
			clientSecret = settings.clientSecret;
			accessToken = settings.accessToken;
			refreshToken = settings.refreshToken;
		});
		return unsubscribe;
	});

	const launchWebAuthFlow = async () => {
		try {
			const result = await _launchWebAuthFlow({
				clientID: clientId,
				clientSecret
			});
			await settings.update({
				accessToken: result.accessToken,
				refreshToken: result.refreshToken
			});
			putMessage({ type: 'success', message: 'Successfully authorized app.' });
		} catch (err) {
			console.error('Failed to authorize app:', err);
			putMessage({ type: 'error', message: String(err) });
		}
	};

	const save = async () => {
		await settings.update({
			clientId,
			clientSecret,
			accessToken,
			refreshToken
		});
		putMessage({ type: 'success', message: 'Settings saved.' });
	};

	onMount(async () => {
		await settings.ready();
	});
</script>

<div>
	<div class="space-y-6">
		<!-- API Credentials Section -->
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div class="mb-6 border-b border-gray-200 pb-4">
				<Heading tag="h4" class="text-xl font-bold text-gray-900">Raindrop.io Integration</Heading>
				<P class="mt-2 text-sm text-gray-600">Connect your Raindrop.io account to sync bookmarks</P>
			</div>

			<!-- Registration Guide -->
			<div class="mb-6">
				<Accordion class="rounded-lg border border-green-200 bg-green-50">
					<AccordionItem class="p-4">
						{#snippet header()}
							<span class="text-sm font-semibold text-green-900">
								📝 How to Register Your Application
							</span>
						{/snippet}
						<P class="mb-3 text-xs text-green-700">
							Follow these steps to create your OAuth application on Raindrop.io:
						</P>

						<ol class="ml-4 space-y-4 text-xs text-green-800">
							<li class="list-decimal">
								Visit
								<a
									href="https://app.raindrop.io/settings/integrations"
									target="_blank"
									class="font-medium underline hover:text-green-900"
								>
									Raindrop.io Settings → Integrations
								</a>
							</li>

							<li class="list-decimal">
								<div>Click <strong>Create new app</strong> button</div>
								<div class="mt-2 rounded-lg bg-transparent p-2">
									<img
										src={imgCNA1}
										alt="Create new app dialog"
										class="mx-auto max-w-sm rounded shadow-sm"
									/>
								</div>
								<div class="mt-2">
									Enter a name like <code class="rounded bg-white px-1 py-0.5 font-mono text-xs"
										>Raindrop Sync for Chrome</code
									> and agree to the Terms of Service
								</div>
							</li>

							<li class="list-decimal">
								<div>Open the created app and fill in the complete form with these values:</div>
								<div class="mt-2 rounded-lg bg-transparent p-2">
									<img
										src={imgCNA2}
										alt="App registration form"
										class="mx-auto max-w-md rounded shadow-sm"
									/>
								</div>
								<ul class="mt-2 ml-4 space-y-1 text-xs">
									<li class="list-disc">
										<strong>Name:</strong>
										<code class="rounded bg-white px-1 py-0.5 font-mono text-xs"
											>Raindrop Sync for Chrome</code
										>
									</li>
									<li class="list-disc">
										<strong>Description:</strong>
										<code class="rounded bg-white px-1 py-0.5 font-mono text-xs"
											>{extensionDescription}</code
										>
									</li>
									<li class="list-disc">
										<strong>Site:</strong>
										<code class="rounded bg-white px-1 py-0.5 font-mono text-xs"
											>https://{extensionId}.chromiumapp.org/</code
										>
									</li>
									<li class="list-disc">
										<strong>Redirect URI:</strong>
										<code class="rounded bg-white px-1 py-0.5 font-mono text-xs"
											>https://{extensionId}.chromiumapp.org/</code
										>
									</li>
									<li class="list-disc">
										<strong>Cover:</strong> Upload an image if desired
									</li>
								</ul>
							</li>

							<li class="list-decimal">
								Now choose one of two authentication methods:
								<ul class="mt-2 ml-4 space-y-1 text-xs">
									<li class="list-disc">
										<strong>Method 1 (Recommended):</strong> Copy the Client ID and Client Secret to
										the fields below, then click <strong>Authorize with Raindrop.io</strong> to complete
										OAuth flow
									</li>
									<li class="list-disc">
										<strong>Method 2 (Testing):</strong> Click <strong>Create test token</strong>
										and paste it directly into the
										<strong>Access Token</strong> field below
									</li>
								</ul>
							</li>
						</ol>
					</AccordionItem>
				</Accordion>
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
						<SecretInput bind:value={clientId}>
							<span class="text-sm font-medium">Client ID</span>
						</SecretInput>
						<SecretInput bind:value={clientSecret}>
							<span class="text-sm font-medium">Client Secret</span>
						</SecretInput>
					</div>
					<div class="mt-4 flex justify-end">
						<Button onclick={launchWebAuthFlow} class="px-6">🔗 Authorize with Raindrop.io</Button>
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
				<Button onclick={save} class="px-6">Save Credentials</Button>
			</div>
		</div>
	</div>
</div>
