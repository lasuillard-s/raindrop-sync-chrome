import { BookmarkIsNotAFolderError } from '$lib/sync';
import { TestTreeNode } from '$test-helpers/tree';
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

		expect(() => bookmark.addChild(child)).toThrow(new BookmarkIsNotAFolderError(bookmark.id));
	});

	it('computes descendant counts and updates them correctly after adding children', () => {
		// Tree structure:
		// Root (2)
		// └── Folder (1)
		//     └── Bookmark
		const root = new TestTreeNode({ id: '0', title: '', type: 'folder' });
		const folder = new TestTreeNode({ id: '1', title: 'Folder', type: 'folder', parent: root });
		const bookmark = new TestTreeNode({
			id: '2',
			title: 'Bookmark',
			type: 'bookmark',
			url: 'https://example.com',
			parent: folder
		});

		expect(bookmark.countDescendants()).toBe(0);
		expect(folder.countDescendants()).toBe(1);
		expect(root.countDescendants()).toBe(2);

		// Add another bookmark under the Folder, now structure is:
		// Root (3)
		// └── Folder (2)
		//     ├── Bookmark
		//     └── Bookmark 2
		new TestTreeNode({
			id: '3',
			title: 'Bookmark 2',
			type: 'bookmark',
			url: 'https://example.org',
			parent: folder
		});

		expect(folder.countDescendants()).toBe(2);
		expect(root.countDescendants()).toBe(3);
	});

	it('traverses nodes in depth-first order', () => {
		// Tree structure:
		// Root
		// ├── A
		// │   └── B
		// └── C
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

	it('traverses nodes in breadth-first order', () => {
		// Tree structure:
		// Root
		// ├── A
		// │   └── B
		// └── C
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
		root.bfs((node) => {
			visited.push(node.getPath().toString());
		});

		expect(visited).toEqual(['/', '/A', '/C', '/A/B']);
	});
});
