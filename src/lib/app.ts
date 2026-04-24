import { SettingsStore } from '~/config';
import {
	ChromeAlarmScheduler,
	ChromeReadableBookmarkRepository,
	ChromeWritableBookmarkRepository,
	defaultBrowserProxy,
	type BrowserProxy
} from '~/lib/browser';
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
		const syncManagerOptions: ConstructorParameters<typeof SyncManager>[0] = {
			settings: opts?.settings,
			readableRepository: new ChromeReadableBookmarkRepository(this.browserProxy),
			writableRepository: new ChromeWritableBookmarkRepository(this.browserProxy),
			alarmScheduler: new ChromeAlarmScheduler(this.browserProxy)
		};

		if (opts?.raindropClient) {
			syncManagerOptions.raindropClient = opts.raindropClient;
		}

		return new SyncManager(syncManagerOptions);
	}
}
