<script lang="ts">
	import { format, formatDistanceToNow } from 'date-fns';
	import { A, Toggle } from 'flowbite-svelte';
	import { RefreshOutline } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import { appSettings } from '~/config';
	import syncManager, { type SyncEvent, type SyncEventListener } from '~/lib/sync';

	let isSyncing = false;
	let forceSync = false;
	let rotation = 0;
	let animationFrame: number | null = null;
	const clientLastSync = appSettings.clientLastSync;
	let lastSyncTime = $clientLastSync;
	let latestSyncEvent: SyncEvent | null = null;

	// Subscribe to clientLastSync changes
	$: lastSyncTime = $clientLastSync;

	class SyncEventObserver implements SyncEventListener {
		onEvent(event: SyncEvent) {
			latestSyncEvent = event;
		}
	}

	onMount(() => {
		const observer = new SyncEventObserver();
		syncManager.addListener(observer);
		return () => {
			syncManager.removeListener(observer);
		};
	});

	const formatLastSync = (date: Date): string => {
		// If never synced (epoch date)
		if (date.getTime() === 0) {
			return 'Never synced';
		}

		// ... ago
		const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
		if (daysDiff < 7) {
			return formatDistanceToNow(date, { addSuffix: true });
		}

		// MM/DD/YYYY
		return format(date, 'P');
	};

	const startRotation = () => {
		const animate = () => {
			rotation = (rotation + 8) % 360;
			if (isSyncing) {
				animationFrame = requestAnimationFrame(animate);
			}
		};
		animationFrame = requestAnimationFrame(animate);
	};

	const handleSync = async () => {
		if (isSyncing) return;

		isSyncing = true;
		startRotation();
		try {
			await syncManager.startSync({ force: forceSync });
		} catch (error) {
			console.error('Sync error:', error);
		} finally {
			isSyncing = false;
			if (animationFrame !== null) {
				cancelAnimationFrame(animationFrame);
				animationFrame = null;
			}
			// Reset rotation to 0 with smooth transition; to rewind it back, set it to 0
			rotation = 360;
		}
	};

	const openOptionsPage = () => chrome.runtime.openOptionsPage();
</script>

<main class="flex w-72 flex-col bg-white">
	<!-- Header -->
	<div class="border-b border-gray-200 px-4 py-3">
		<h1 class="text-center text-lg font-semibold text-gray-800">Raindrop Sync for Chrome</h1>
	</div>

	<!-- Main Content -->
	<div class="flex flex-col items-center px-4 py-6">
		<!-- Sync Button -->
		<button
			onclick={handleSync}
			disabled={isSyncing}
			class="group flex h-36 w-36 items-center justify-center rounded-full border-2 border-blue-500 bg-white transition-all duration-200 hover:border-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
			aria-label="Sync bookmarks"
		>
			<RefreshOutline
				class="h-18 w-18 text-blue-500 group-hover:text-blue-600"
				style="transform: rotate({rotation}deg); transition: transform {isSyncing
					? '0s'
					: '0.5s ease-out'};"
			/>
		</button>

		<!-- Status Info -->
		<p
			class="mt-6 text-center text-sm {latestSyncEvent?.type === 'error'
				? 'text-red-600'
				: 'text-gray-600'}"
		>
			{latestSyncEvent?.toMessage() ?? ''}
		</p>
		<p class="mt-4 text-sm text-gray-600">
			Last sync: <span class="font-medium text-gray-800">{formatLastSync(lastSyncTime)}</span>
		</p>

		<!-- Force Sync Toggle -->
		<div class="mt-6 flex w-full justify-center">
			<Toggle bind:checked={forceSync} disabled={isSyncing}>
				<span class="text-sm text-gray-700">Force sync</span>
			</Toggle>
		</div>
	</div>

	<!-- Footer -->
	<div class="border-t border-gray-200 px-4 py-3">
		<div class="flex items-center justify-end">
			<A onclick={openOptionsPage} class="text-sm text-blue-600 hover:text-blue-700">Settings</A>
		</div>
	</div>
</main>

<style lang="postcss">
	@reference '../app.css';

	:root {
		@apply mx-2 my-1 pb-2;
	}
</style>
