import { ChromeBookmarkRepository } from '~/lib/browser/chrome';
import raindropClient from '~/lib/raindrop';
import appSettings from '~/lib/settings';
import { SyncManager } from './manager';

export {
	SyncEvent,
	SyncEventComplete,
	SyncEventError,
	SyncEventProgress,
	SyncEventStart
} from './event-listener';
export type { SyncEventListener, SyncEventProgressKind } from './event-listener';
export { SyncManager } from './manager';

export default new SyncManager({
	appSettings,
	adapter: new ChromeBookmarkRepository(),
	raindropClient: raindropClient
});
