import { SettingsStore } from '~/config';
import {
	ChromeAlarmScheduler,
	ChromeBookmarkTreeBuilder,
	ChromeReadableBookmarkRepository,
	ChromeWritableBookmarkRepository,
	defaultBrowserProxy,
	type BrowserProxy
} from '~/lib/browser';
import { RaindropTreeBuilder } from '~/lib/raindrop';
import type { Raindrop } from '~/lib/raindrop/client';
import { SyncManager } from '~/lib/sync';

/**
 * Composition root for application-scoped dependencies.
 */
export class App {
	private static defaultInstance: App | null = null;

	readonly browserProxy: BrowserProxy;

	constructor(browserProxy: BrowserProxy = defaultBrowserProxy) {
		this.browserProxy = browserProxy;
	}

	/**
	 * Get default application composition root.
	 * @returns Default App singleton.
	 */
	static getInstance(): App {
		if (!App.defaultInstance) {
			App.defaultInstance = new App();
		}
		return App.defaultInstance;
	}

	getSettingsStore(): SettingsStore {
		return SettingsStore.getOrCreate();
	}

	createSyncManager(opts?: { settings?: SettingsStore; raindropClient?: Raindrop }): SyncManager {
		const syncManagerOptions: NonNullable<ConstructorParameters<typeof SyncManager>[0]> = {
			settings: opts?.settings ?? this.getSettingsStore(),
			sourceRepo: new ChromeReadableBookmarkRepository(this.browserProxy),
			targetRepo: new ChromeWritableBookmarkRepository(this.browserProxy),
			alarmScheduler: new ChromeAlarmScheduler(this.browserProxy),
			currentBookmarkTreeBuilder: new ChromeBookmarkTreeBuilder(this.browserProxy)
		};

		if (opts?.raindropClient) {
			syncManagerOptions.raindropClient = opts.raindropClient;
			syncManagerOptions.expectedBookmarkTreeBuilder = new RaindropTreeBuilder(opts.raindropClient);
		}

		return new SyncManager(syncManagerOptions);
	}
}
