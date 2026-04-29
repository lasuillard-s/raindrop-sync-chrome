import { generated } from '@lasuillard/raindrop-client';
import { getClient, type Raindrop } from '~/lib/raindrop';
import { ReadableAdapter, TreeNode } from '~/lib/sync';
import { normalizeUrl } from '~/lib/util/string';

type GetRootCollectionsResponseItem = generated.GetRootCollectionsResponse['items'][0];
type GetChildCollectionsResponseItem = generated.GetChildCollectionsResponse['items'][0];
type GetAllRaindropsResponseItem = generated.GetRaindropsResponse['items'][0];

/** Raindrop collection or bookmark items. */
export type RaindropItem =
	| GetRootCollectionsResponseItem
	| GetChildCollectionsResponseItem
	| GetAllRaindropsResponseItem;

export class RaindropBookmarkTreeNode extends TreeNode {
	declare raw: RaindropItem | null;

	constructor(args: {
		id: string;
		parent: TreeNode | null;
		title: string;
		url: string | null;
		type: 'folder' | 'bookmark';
		raw: RaindropItem | null;
	}) {
		super(args);
	}

	getHash(): string {
		if (this.isFolder()) {
			return this.getPath().toString();
		} else {
			// * Chrome handles redirection so URL changes after saved to bookmarks
			return this.getPath().toString() + '|' + normalizeUrl(this.url || '');
		}
	}
}

export class RaindropAdapter extends ReadableAdapter<RaindropBookmarkTreeNode> {
	private readonly client: Raindrop;

	constructor(client?: Raindrop) {
		super();
		this.client = client ?? getClient();
	}

	protected resolveBaseNodeId(baseNodeId?: string): string {
		return baseNodeId || '';
	}

	protected async fetchNodes(baseNodeId: string): Promise<RaindropBookmarkTreeNode[]> {
		let allItems: RaindropItem[];
		if (baseNodeId !== '') {
			allItems = await this.client.getAllRaindrops(Number(baseNodeId));
		} else {
			const [{ data: groups }, { data: collections }, raindrops] = await Promise.all([
				this.client.collection.getRootCollections(),
				this.client.collection.getChildCollections(),
				this.client.getAllRaindrops(0 /* ALL */)
			]);
			allItems = [...groups.items, ...collections.items, ...raindrops];
		}

		const nodes = allItems.map((item) => {
			const isFolder = !Object.hasOwn(item, 'link');
			return new RaindropBookmarkTreeNode({
				id: item._id.toString(),
				parent: null, // Later set when building the tree
				title: item.title,
				url: (item as any).link || null,
				type: isFolder ? 'folder' : 'bookmark',
				raw: item
			});
		});

		// Deduplicate items
		const uniqueNodes = nodes.filter(
			(left, index, self) => index === self.findIndex((right) => right.id === left.id)
		);

		return uniqueNodes;
	}

	protected buildTree(
		nodes: RaindropBookmarkTreeNode[],
		baseNodeId: string
	): RaindropBookmarkTreeNode {
		const rootAlias = '$root';
		const root = new RaindropBookmarkTreeNode({
			id: baseNodeId,
			parent: null,
			title: 'Raindrop.io',
			url: null,
			type: 'folder',
			raw: null
		});
		const nodeMap = new Map<string, RaindropBookmarkTreeNode>();
		nodeMap.set(root.id, root);
		nodeMap.set(rootAlias, root);
		nodes.forEach((node) => nodeMap.set(node.id, node));

		for (const node of nodes) {
			const originalParentId =
				// @ts-expect-error Multi-type handling
				node.raw?.parent?.$id.toString() || node.raw?.collection?.$id.toString() || null;

			const parentId: string =
				// Unsorted (-1) does not belong to any collection, treat it as root-level
				originalParentId === '-1' || originalParentId === null ? rootAlias : originalParentId;

			const parent = nodeMap.get(parentId);
			if (!parent) {
				console.warn(`Parent with id ${parentId} not found for node ${node.id}`);
				continue;
			}
			parent.addChild(node);
		}

		return root;
	}

	async changedSince(date: Date, options?: { thresholdSeconds: number }): Promise<boolean> {
		const baseDate = options?.thresholdSeconds
			? new Date(date.getTime() - options.thresholdSeconds * 1_000)
			: date;

		// Check if any raindrop has been updated since the base date
		const {
			data: { user }
		} = await this.client.user.getCurrentUser();
		const lastUpdate = user.lastUpdate ? new Date(user.lastUpdate) : new Date(0);
		return lastUpdate > baseDate;
	}
}
