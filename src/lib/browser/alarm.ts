export interface AlarmService {
	clearAll(): Promise<void>;
	create(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void>;
	onAlarmAddListener(listener: (alarm: chrome.alarms.Alarm) => void | Promise<void>): void;
}

export class WebExtensionAlarmService implements AlarmService {
	async clearAll(): Promise<void> {
		await chrome.alarms.clearAll();
	}

	async create(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): Promise<void> {
		await chrome.alarms.create(name, alarmInfo);
	}

	onAlarmAddListener(listener: (alarm: chrome.alarms.Alarm) => void | Promise<void>): void {
		chrome.alarms.onAlarm.addListener(listener);
	}
}
