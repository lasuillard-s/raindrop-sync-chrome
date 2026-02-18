import { appSettings } from '~/config';
import { ChromeBookmarkRepository } from '~/lib/browser/chrome';
import raindropClient from '~/lib/raindrop';
import { SyncManager } from './manager';

export { SyncDiff } from './diff';
export {
	SyncEvent,
	SyncEventComplete,
	SyncEventError,
	SyncEventProgress,
	SyncEventStart
} from './event-listener';
export type { SyncEventListener, SyncEventProgressKind } from './event-listener';
export { SyncManager } from './manager';
export { NodeData, TreeNode } from './tree';

export default new SyncManager({
	appSettings,
	repository: new ChromeBookmarkRepository(),
	raindropClient: raindropClient
});
