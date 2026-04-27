import { generated } from '@lasuillard/raindrop-client';
import { TreeBuilder, type TreeBuildOptions } from '~/lib/sync/builder';
import { NodeData, TreeNode } from '~/lib/sync/tree'; // Be careful for recursive import
import { normalizeUrl } from '~/lib/util/string';
import type { Raindrop, RaindropItem as ClientRaindropItem } from './client';

type GetRootCollectionsResponseItem = generated.GetRootCollectionsResponse['items'][0];
type GetChildCollectionsResponseItem = generated.GetChildCollectionsResponse['items'][0];
type GetAllRaindropsResponseItem = generated.GetRaindropsResponse['items'][0];

/** Raindrop collection or bookmark items. */
export type RaindropItem =
	| GetRootCollectionsResponseItem
	| GetChildCollectionsResponseItem
	| GetAllRaindropsResponseItem;

export class RaindropNodeData extends NodeData {
	rawData: RaindropItem;

	constructor(data: RaindropItem) {
		super();
		this.rawData = data;
	}

	// Raindrop.io internal ID
	getId(): string {
		return this.rawData._id.toString();
	}

	getParentId(): string | null {
		const parentId: string | null =
			// @ts-expect-error Multi-type handling; consider type guards
			this.rawData.parent?.$id.toString() || this.rawData.collection?.$id.toString() || null;

		// ? Root for raindrops is -1 (unsorted) if it does not belong to any collection
		// ? So to make sure tree build work properly, redirect the value
		if (parentId === '-1') {
			return null;
		}

		return parentId;
	}

	getHash(): string {
		let hash: string | null | undefined;
		if (this.isFolder()) {
			hash = this.getName();
		} else {
			// * Chrome handles redirection so URL changes after saved to bookmarks
			hash = normalizeUrl(this.getUrl() || '');
		}
		return hash || Math.random().toString();
	}

	getName(): string {
		return this.rawData.title;
	}

	getUrl(): string | null {
		// @ts-expect-error Multi-type handling
		return this.rawData.link || null;
	}

	isFolder(): boolean {
		return this.rawData && !Object.hasOwn(this.rawData, 'link');
	}
}

type RaindropTreeSources = {
	groups: GetRootCollectionsResponseItem[];
	collections: GetChildCollectionsResponseItem[];
	raindrops: ClientRaindropItem[];
};

/**
 * Builds a tree from Raindrop collections and bookmark items.
 */
export class RaindropTreeBuilder extends TreeBuilder<RaindropTreeSources, RaindropNodeData> {
	private readonly raindropClient: Raindrop;

	constructor(raindropClient: Raindrop) {
		super();
		this.raindropClient = raindropClient;
	}

	protected async fetchSources(): Promise<RaindropTreeSources> {
		const [{ data: groups }, { data: collections }, raindrops] = await Promise.all([
			this.raindropClient.collection.getRootCollections(),
			this.raindropClient.collection.getChildCollections(),
			this.raindropClient.getAllRaindrops(0 /* ALL */)
		]);

		return {
			groups: groups.items,
			collections: collections.items,
			raindrops
		};
	}

	protected preprocess(sources: RaindropTreeSources): RaindropNodeData[] {
		const groupNodes = sources.groups.map((group) => new RaindropNodeData(group));
		const collectionNodes = sources.collections.map(
			(collection) => new RaindropNodeData(collection)
		);
		const raindropNodes = sources.raindrops.map(
			(raindrop) => new RaindropNodeData({ ...raindrop })
		);

		// Deduplicate items
		// ? Need to check and update the API client to avoid duplicates in the first place
		return [...groupNodes, ...collectionNodes, ...raindropNodes].filter(
			(left, index, self) => index === self.findIndex((right) => right.getId() === left.getId())
		);
	}

	protected override getDefaultBuildOptions(): Required<Pick<TreeBuildOptions, 'unwrapRoot'>> {
		return { unwrapRoot: false };
	}
}

/**
 * Creates a tree structure from Raindrop.io collections.
 * @param raindropClient Raindrop.io client
 * @param builder Tree builder instance to use for construction.
 * @returns Root node of the tree
 */
export async function createTreeFromRaindrops(
	raindropClient: Raindrop,
	builder: RaindropTreeBuilder = new RaindropTreeBuilder(raindropClient)
): Promise<TreeNode<RaindropNodeData>> {
	// TODO(#165): Sort nodes as same in raindrop.io; pending for check & review
	// allNodes.sort((a, b) => a.rawData.sort.toString().localeCompare(b.rawData.sort.toString()));

	return await builder.build();
}
