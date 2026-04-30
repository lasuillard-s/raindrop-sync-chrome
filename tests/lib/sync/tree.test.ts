import { BookmarkIsNotAFolderError } from '@lib/sync';
import { TestTreeNode } from '@test-helpers/tree';
import { describe, expect, it } from 'vitest';

describe('TreeNode', () => {
	it('builds path using parent links', () => {
		const root = new TestTreeNode({ id: '0', title: '', type: 'folder' });
		const folder = new TestTreeNode({ id: '1', title: 'Folder', type: 'folder', parent: root });
		const bookmark = new TestTreeNode({
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
		const root = new TestTreeNode({ id: '0', title: '', type: 'folder' });
		const folder = new TestTreeNode({ id: '1', title: 'Folder', type: 'folder', parent: root });
		const bookmark = new TestTreeNode({
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
		const bookmark = new TestTreeNode({
			id: '1',
			title: 'Bookmark',
			type: 'bookmark',
			url: 'https://example.com'
		});
		const child = new TestTreeNode({
			id: '2',
			title: 'Child',
			type: 'bookmark',
			url: 'https://child.example'
		});

		expect(() => bookmark.addChild(child)).toThrowError(BookmarkIsNotAFolderError);
	});

	it('traverses nodes in depth-first order', () => {
		const root = new TestTreeNode({ id: '0', title: '', type: 'folder' });
		const folderA = new TestTreeNode({ id: 'a', title: 'A', type: 'folder', parent: root });
		new TestTreeNode({
			id: 'b',
			title: 'B',
			type: 'bookmark',
			url: 'https://b.example',
			parent: folderA
		});
		new TestTreeNode({
			id: 'c',
			title: 'C',
			type: 'bookmark',
			url: 'https://c.example',
			parent: root
		});

		const visited: string[] = [];
		root.dfs((node) => {
			visited.push(node.getPath().toString());
		});

		expect(visited).toEqual(['/', '/A', '/A/B', '/C']);
	});
});
