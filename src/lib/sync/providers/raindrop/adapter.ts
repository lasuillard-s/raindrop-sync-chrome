import { getClient, type Raindrop } from '$lib/raindrop';
import { ReadableAdapter, TreeNode, type FetchTreeOptions } from '$lib/sync';
import { normalizeUrl } from '$lib/util/string';
import { generated } from '@lasuillard/raindrop-client';

type GetRootCollectionsResponseItem = generated.GetRootCollectionsResponse['items'][0];
type GetChildCollectionsResponseItem = generated.GetChildCollectionsResponse['items'][0];
type GetAllRaindropsResponseItem = generated.GetRaindropsResponse['items'][0];

/** Raindrop collection or bookmark items. */
export type RaindropItem =
  GetRootCollectionsResponseItem | GetChildCollectionsResponseItem | GetAllRaindropsResponseItem;

export class RaindropBookmarkTreeNode extends TreeNode {
  declare protected readonly raw: RaindropItem | null;

  get rawData(): RaindropItem | null {
    return this.raw;
  }

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

  protected async fetchNodes(
    baseNodeId: string,
    options?: FetchTreeOptions
  ): Promise<RaindropBookmarkTreeNode[]> {
    const query = options?.query?.trim() || undefined;
    let allItems: RaindropItem[];
    if (baseNodeId !== '') {
      allItems = await this.client.getAllRaindrops(Number(baseNodeId), {
        search: query
      });
    } else {
      const [{ data: groups }, { data: collections }, raindrops] = await Promise.all([
        this.client.collection.getRootCollections(),
        this.client.collection.getChildCollections(),
        this.client.getAllRaindrops(0 /* ALL */, { search: query })
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
    // ! If there are multiple items with the same ID, only the last one will be kept.
    const nodeMap = new Map<string, RaindropBookmarkTreeNode>(nodes.map((node) => [node.id, node]));
    const uniqueNodes = Array.from(nodeMap.values());

    return uniqueNodes;
  }

  protected buildTree(
    nodes: RaindropBookmarkTreeNode[],
    baseNodeId: string
  ): RaindropBookmarkTreeNode {
    const root = new RaindropBookmarkTreeNode({
      id: baseNodeId,
      parent: null,
      title: 'Raindrop.io',
      url: null,
      type: 'folder',
      raw: null
    });

    // Alias for root node to simplify handling of items without a parent
    const rootAlias = '$root';

    // Build a map of all nodes for easy lookup when establishing parent-child relationships
    const nodeMap = new Map<string, RaindropBookmarkTreeNode>();
    nodeMap.set(root.id, root);
    nodeMap.set(rootAlias, root);
    nodes.forEach((node) => nodeMap.set(node.id, node));

    // Establish parent-child relationships
    for (const node of nodes) {
      const raw = node.rawData as any;
      const originalParentId: string | null =
        raw?.parent?.$id != null
          ? String(raw.parent.$id)
          : raw?.collection?.$id != null
            ? String(raw.collection.$id)
            : null;

      let parentId: string =
        originalParentId === '-1' || originalParentId === null ? rootAlias : originalParentId;

      let parent = nodeMap.get(parentId);
      if (!parent) {
        // If the collection/parent node was not found (e.g. filtered out or root level), attach directly to rootAlias
        parent = nodeMap.get(rootAlias)!;
      }
      parent.addChild(node);
    }

    // Prune empty folders recursively (bottom-up)
    const pruneEmptyFolders = (folder: RaindropBookmarkTreeNode) => {
      if (!folder.children) return;

      // First recursively prune children folders
      for (const child of [...folder.children]) {
        if (child.isFolder()) {
          pruneEmptyFolders(child as RaindropBookmarkTreeNode);
        }
      }

      // Then remove any child folder that is now empty
      for (const child of [...folder.children]) {
        if (child.isFolder() && (!child.children || child.children.length === 0)) {
          folder.removeChild(child);
        }
      }
    };

    pruneEmptyFolders(root);

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
