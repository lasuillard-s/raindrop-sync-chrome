import { describe, expect, it } from 'vitest';
import { BookmarkIsNotAFolderError, TreeNode } from '~/lib/sync';

class TestTreeNode extends TreeNode {
	getHash(): string {
		return `${this.getPath().toString()}|${this.url ?? ''}`;
	}
}

const createNode = (args: {
	id: string;
	title: string;
	type: 'folder' | 'bookmark';
	url?: string | null;
	parent?: TestTreeNode;
}) => {
	const node = new TestTreeNode({
		id: args.id,
		parent: args.parent ?? null,
		title: args.title,
		url: args.url ?? null,
		type: args.type,
		raw: null
	});
	if (args.parent) {
		args.parent.addChild(node);
	}
	return node;
};

describe('TreeNode', () => {
	it('builds path using parent links', () => {
		const root = createNode({ id: '0', title: '', type: 'folder' });
		const folder = createNode({ id: '1', title: 'Folder', type: 'folder', parent: root });
		const bookmark = createNode({
			id: '2',
			title: 'Bookmark',
			type: 'bookmark',
			url: 'https://example.com',
			parent: folder
		});

		expect(root.isRoot()).toBe(true);
		expect(folder.isFolder()).toBe(true);
		expect(bookmark.isFolder()).toBe(false);
		expect(bookmark.getPath().toString()).toBe('/Folder/Bookmark');
	});

	it('adds children only to folders', () => {
		const root = createNode({ id: '0', title: '', type: 'folder' });
		const folder = createNode({ id: '1', title: 'Folder', type: 'folder', parent: root });
		const bookmark = createNode({
			id: '2',
			title: 'Bookmark',
			type: 'bookmark',
			url: 'https://example.com'
		});

		folder.addChild(bookmark);
		expect(folder.children).toHaveLength(1);
		expect(folder.children?.[0].id).toBe('2');
		expect(bookmark.getPath().toString()).toBe('/Folder/Bookmark');
	});

	it('throws when adding child to bookmark', () => {
		const bookmark = createNode({
			id: '1',
			title: 'Bookmark',
			type: 'bookmark',
			url: 'https://example.com'
		});
		const child = createNode({
			id: '2',
			title: 'Child',
			type: 'bookmark',
			url: 'https://child.example'
		});

		expect(() => bookmark.addChild(child)).toThrowError(BookmarkIsNotAFolderError);
	});

	it('traverses nodes in depth-first order', () => {
		const root = createNode({ id: '0', title: '', type: 'folder' });
		const folderA = createNode({ id: 'a', title: 'A', type: 'folder', parent: root });
		createNode({
			id: 'b',
			title: 'B',
			type: 'bookmark',
			url: 'https://b.example',
			parent: folderA
		});
		createNode({ id: 'c', title: 'C', type: 'bookmark', url: 'https://c.example', parent: root });

		const visited: string[] = [];
		root.dfs((node) => {
			visited.push(node.getPath().toString());
		});

		expect(visited).toEqual(['/', '/A', '/A/B', '/C']);
	});
});
