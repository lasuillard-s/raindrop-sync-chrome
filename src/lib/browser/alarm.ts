export interface AlarmScheduler {
	clearAll(): Promise<void>;
	create(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void>;
}

export class ChromeAlarmScheduler implements AlarmScheduler {
	async clearAll(): Promise<void> {
		await chrome.alarms.clearAll();
	}

	async create(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void> {
		await chrome.alarms.create(name, alarmInfo);
	}
}
