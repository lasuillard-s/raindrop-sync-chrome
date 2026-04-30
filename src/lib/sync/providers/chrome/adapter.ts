import { SyncActionType, TreeNode, WritableAdapter, type SyncAction } from '~/lib/sync';
import { normalizeUrl } from '~/lib/util/string';
import { ChromeBookmarkRepository } from './repository';

export class ChromeBookmarkTreeNode extends TreeNode {
	declare readonly raw: chrome.bookmarks.BookmarkTreeNode;

	constructor(args: {
		id: string;
		parent: TreeNode | null;
		title: string;
		url: string | null;
		type: 'folder' | 'bookmark';
		raw: chrome.bookmarks.BookmarkTreeNode | null;
	}) {
		super(args);
	}

	getHash(): string {
		let hash: string | null | undefined;
		if (this.isFolder()) {
			hash = this.getPath().toString();
		} else {
			// * Chrome handles redirection so URL changes after saved to bookmarks
			hash = this.getPath().toString() + '|' + normalizeUrl(this.url || '');
		}
		return hash;
	}
}

export class ChromeAdapter extends WritableAdapter<ChromeBookmarkTreeNode> {
	private readonly repository: ChromeBookmarkRepository;

	constructor(repository?: ChromeBookmarkRepository) {
		super();
		this.repository = repository ?? new ChromeBookmarkRepository();
	}

	protected resolveBaseNodeId(baseNodeId?: string): string {
		// Chrome's root node has id '0'
		return baseNodeId || '0';
	}

	protected async fetchNodes(baseNodeId: string): Promise<ChromeBookmarkTreeNode[]> {
		const baseNode = await this.repository.getFolderBy({ id: baseNodeId });

		// * Ensure baseNode's parent is null when fetching a subtree
		// * This is necessary to remove dangling parent references when fetching a subtree that is not the entire tree
		baseNode.parentId = undefined;

		const nodes: ChromeBookmarkTreeNode[] = [];
		const queue = [baseNode];
		while (queue.length > 0) {
			const rawNode = queue.shift()!;
			nodes.push(
				new ChromeBookmarkTreeNode({
					id: rawNode.id,
					parent: null, // Later set when building the tree
					title: rawNode.title,
					url: rawNode.url || null,
					type: rawNode.url ? 'bookmark' : 'folder',
					raw: rawNode
				})
			);
			if (rawNode.children) {
				queue.push(...rawNode.children);
			}
		}

		return nodes;
	}

	protected buildTree(nodes: ChromeBookmarkTreeNode[], baseNodeId: string): ChromeBookmarkTreeNode {
		const nodeMap = new Map<string, ChromeBookmarkTreeNode>();
		nodes.forEach((node) => nodeMap.set(node.id, node));
		const root = nodeMap.get(baseNodeId)!;

		for (const node of nodes) {
			const parentId = node.raw.parentId;
			if (parentId) {
				const parent = nodeMap.get(parentId);
				if (!parent) {
					console.warn(`Parent with id ${parentId} not found for node ${node.id}`);
					continue;
				}
				parent.addChild(node);
			}
		}

		return root;
	}

	async changedSince(date: Date, options?: { thresholdSeconds: number }): Promise<boolean> {
		const baseDate = options?.thresholdSeconds
			? new Date(date.getTime() - options.thresholdSeconds * 1000)
			: date;

		const root = await this.getTree();
		let hasChanges = false;
		root.bfs((node) => {
			const rawData = (node as ChromeBookmarkTreeNode).raw;
			const dateAdded = rawData.dateAdded;
			if (dateAdded && dateAdded > baseDate.getTime()) {
				hasChanges = true;
				return 'break';
			}

			const dateGroupModified = rawData.dateGroupModified;
			if (dateGroupModified && dateGroupModified > baseDate.getTime()) {
				hasChanges = true;
				return 'break';
			}
		});

		return hasChanges;
	}

	async hasFolderWithId(id: string): Promise<boolean> {
		const folder = await this.repository.findFolderBy({ id });
		return Boolean(folder);
	}

	async applyAction(action: SyncAction): Promise<void> {
		console.debug('Applying action to Chrome:', action);
		switch (action.type) {
			case SyncActionType.CreateBookmark:
				await this.repository.createBookmarkByPath(
					action.args.path,
					{
						url: action.args.url
					},
					{ createParentsIfNotExists: true }
				);
				break;
			case SyncActionType.CreateFolder:
				this.repository.createFolderByPath(action.args.path, { createParentsIfNotExists: true });
				break;
			case SyncActionType.UpdateBookmark:
				await this.repository.updateBookmark(action.args.id, {
					title: action.args.title,
					url: action.args.url
				});
				break;
			case SyncActionType.UpdateFolder:
				await this.repository.updateFolder(action.args.id, {
					title: action.args.title
				});
				break;
			case SyncActionType.Delete:
				await this.repository.delete(action.args.id);
				break;
			default:
				// ? How can I enforce the linter to recognize that this is an exhaustive check and not require a default case?
				throw new Error(`Unhandled action type: ${(action as any).type}`);
		}
	}
}
