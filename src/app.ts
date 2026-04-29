import { SettingsStore } from '~/config';
import { ChromeAdapter } from '~/lib/sync/providers/chrome';
import { RaindropAdapter } from '~/lib/sync/providers/raindrop';
import { SyncService } from '~/services/sync';

/**
 * Main application class that composes services and provides access to global state.
 */
export class App {
	private static defaultInstance: App | null = null;

	readonly settings: SettingsStore;
	readonly sync: SyncService;

	constructor(options?: { settings?: SettingsStore; sync?: SyncService }) {
		this.settings = options?.settings ?? SettingsStore.getOrCreate();
		this.sync =
			options?.sync ??
			new SyncService({
				source: new RaindropAdapter(),
				target: new ChromeAdapter(),
				appSettings: this.settings
			});
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
}
