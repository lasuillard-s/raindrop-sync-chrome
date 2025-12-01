import { writable, type Readable, type Updater } from 'svelte/store';

// https://github.com/joshnuss/svelte-local-storage-store
export interface Storage {
	get(keys: string | string[]): Promise<{ [key: string]: any }>;
	set(items: { [key: string]: any }): Promise<void>;
	clear(): Promise<void>;
}

// Dummy in-memory storage for testing w/o real storage backend
export class DummyStorage implements Storage {
	protected map: Map<string, unknown> = new Map();

	get(keys: string | string[]): Promise<{ [key: string]: unknown }> {
		const result: [string, unknown][] = [];
		const keyArray = Array.isArray(keys) ? keys : [keys];
		for (const [key, value] of this.map.entries()) {
			if (keyArray.includes(key)) {
				result.push([key, value]);
			}
		}
		return Promise.resolve(Object.fromEntries(result));
	}
	set(items: { [key: string]: unknown }): Promise<void> {
		for (const [key, value] of Object.entries(items)) {
			this.map.set(key, value);
		}
		return Promise.resolve();
	}
	clear() {
		this.map.clear();
		return Promise.resolve();
	}
}

export interface Options<T> {
	storage?: Storage;
	serializer?: (value: T) => string;
	deserializer?: (value: string) => T;
}

export interface AsyncWritable<T> extends Readable<T> {
	set(this: void, value: T): Promise<void>;
	update(this: void, updater: Updater<T>): Promise<void>;
}

const defaultStorage = import.meta.env.MODE === 'test' ? new DummyStorage() : chrome.storage.local;

/**
 * Custom store persisting data via Chrome storage API.
 * @param key Key used in persistence storage backend.
 * @param defaultValue Default value for store if value considered not set.
 * @param options Store options.
 * @returns Store instance.
 */
export function persisted<T>(key: string, defaultValue: T, options?: Options<T>): AsyncWritable<T> {
	const storage = options?.storage ?? defaultStorage;
	const serializer = options?.serializer ?? JSON.stringify;
	const deserializer = options?.deserializer ?? JSON.parse;

	// Load previous value from storage
	const { subscribe, set: _set, update: _update } = writable(defaultValue);
	storage.get(key).then((v) => {
		const savedValue = v[key];
		if (savedValue !== undefined) {
			const deserialized = deserializer(savedValue);
			console.debug(`Retrieving value for key "${key}", length is ${savedValue.length}`);
			_set(deserialized);
		} else {
			console.debug(`Value for key "${key}" not found, setting value to default (${defaultValue})`);
			_set(defaultValue);
		}
	});

	return {
		subscribe,
		set: async (value: T) => {
			await storage.set({ [key]: serializer(value) });
			_set(value);
		},
		update: async (updater: Updater<T>) => {
			return _update((last: T) => {
				const value = updater(last);
				storage
					.set({ [key]: serializer(value) })
					?.catch((reason) => console.error('Error while saving value to backend: ' + reason));
				return value;
			});
		}
	};
}
