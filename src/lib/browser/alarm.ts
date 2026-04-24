import { defaultBrowserProxy, type BrowserProxy } from './proxy';

export interface AlarmScheduler {
	clearAll(): Promise<void>;
	create(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void>;
}

export class ChromeAlarmScheduler implements AlarmScheduler {
	private readonly browserProxy: BrowserProxy;

	constructor(browserProxy: BrowserProxy = defaultBrowserProxy) {
		this.browserProxy = browserProxy;
	}

	async clearAll(): Promise<void> {
		await this.browserProxy.alarms.clearAll();
	}

	async create(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void> {
		await this.browserProxy.alarms.create(name, alarmInfo);
	}
}
