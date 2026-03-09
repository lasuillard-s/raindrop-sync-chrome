import { get, writable, type Writable } from 'svelte/store';
import { SettingsRepository } from './repository';
import { DEFAULT_SETTINGS, Settings } from './settings';

export type SettingsState = 'idle' | 'loading' | 'ready' | 'error';

export class SettingsStore {
	private static instance: SettingsStore | null = null;

	private repository: SettingsRepository;
	private data: Writable<Settings>;
	private state: Writable<SettingsState>;
	private error: Writable<Error | null>;
	private readyPromise: Promise<void> | null = null;

	constructor(repository?: SettingsRepository) {
		this.repository = repository ?? new SettingsRepository();
		this.data = writable<Settings>(DEFAULT_SETTINGS);
		this.state = writable<SettingsState>('idle');
		this.error = writable<Error | null>(null);
	}

	static getOrCreate(): SettingsStore {
		if (!SettingsStore.instance) {
			SettingsStore.instance = new SettingsStore();
		}
		return SettingsStore.instance;
	}

	get $data() {
		return this.data;
	}

	get snapshot(): Settings {
		return get(this.$data);
	}

	get $state() {
		return this.state;
	}

	get $error() {
		return this.error;
	}

	async init(): Promise<void> {
		if (!this.readyPromise) {
			this.readyPromise = this.loadSettings();
		}
		return this.readyPromise;
	}

	private async loadSettings(): Promise<void> {
		this.state.set('loading');
		this.error.set(null);
		try {
			const settings = await this.repository.load();
			this.data.set(settings);
			this.state.set('ready');
			console.debug('Settings loaded successfully');
		} catch (err) {
			this.error.set(err instanceof Error ? err : new Error(String(err)));
			this.state.set('error');
			console.error('Failed to load settings:', err);
			throw err;
		}
	}

	async ready(): Promise<void> {
		if (this.isReady()) {
			return;
		}
		await this.init();
	}

	isReady(): boolean {
		return get(this.$state) === 'ready';
	}

	async update(patch: Partial<Settings>): Promise<void> {
		await this.ready();
		this.data.update((current) => ({ ...current, ...patch }));

		// ? Debounce this in the future if needed
		try {
			await this.repository.save(this.snapshot);
			console.debug('Settings updated successfully');
		} catch (err) {
			console.error('Failed to save settings:', err);
		}
	}

	async reset(): Promise<void> {
		await this.repository.clear();
		this.data.set(DEFAULT_SETTINGS);
		console.debug('Settings reset to default');
	}
}
