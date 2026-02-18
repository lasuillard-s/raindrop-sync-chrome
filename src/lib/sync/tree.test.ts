import { beforeEach, describe, expect, it } from 'vitest';
import { Path } from '~/lib/util/path';
import { NodeData, PathConflictError, TreeNode } from './tree';
import { TestNodeData } from '@test-helpers/tree';

describe('NodeData', () => {
	it('should return correct properties', () => {
		const node = new TestNodeData({
			id: 'test-id',
			parentId: 'parent-id',
			name: 'Test Node',
			url: 'http://example.com',
			isFolder: true
		});

		expect(node.getId()).toBe('test-id');
		expect(node.getParentId()).toBe('parent-id');
		expect(node.getName()).toBe('Test Node');
		expect(node.getUrl()).toBe('http://example.com');
		expect(node.isFolder()).toBe(true);
	});
});

describe('TreeNode', () => {
	let rootData: NodeData;
	let exampleData: NodeData[];
	let tree: TreeNode<NodeData>;

	beforeEach(() => {
		/* Example data structure:

    Root
    ├── Folder 1
    │   ├── Bookmark 1-1
    │   └── Folder 1-2
    │       └── Bookmark 1-2-1
    └── Bookmark 2
    */
		rootData = new TestNodeData({
			id: 'root',
			parentId: null,
			name: 'Root',
			url: null,
			isFolder: true
		});
		exampleData = [
			new TestNodeData({
				id: '1',
				parentId: null,
				name: 'Folder 1',
				url: null,
				isFolder: true
			}),
			new TestNodeData({
				id: '2',
				parentId: '1',
				name: 'Bookmark 1-1',
				url: 'http://example.com/1-1',
				isFolder: false
			}),
			new TestNodeData({
				id: '3',
				parentId: '1',
				name: 'Folder 1-2',
				url: null,
				isFolder: true
			}),
			new TestNodeData({
				id: '4',
				parentId: '3',
				name: 'Bookmark 1-2-1',
				url: 'http://example.com/1-2-1',
				isFolder: false
			}),
			new TestNodeData({
				id: '5',
				parentId: null,
				name: 'Bookmark 2',
				url: 'http://example.com/2',
				isFolder: false
			})
		];
		tree = TreeNode.createTree(rootData, exampleData);
	});

	it('should create tree with correct children structure', () => {
		expect(tree).toBeDefined();
		expect(tree.getId()).toBe('root');
		expect(tree.getName()).toBe('/');
		expect(tree.getUrl()).toBe(null);
		expect(tree.getFullPathSegments()).toEqual([]);
		expect(tree.getFullPath().toString()).toBe('/');
		expect(tree.isRoot()).toBe(true);
		expect(tree.isFolder()).toBe(true);
		expect(tree.isTerminal()).toBe(false);

		// Children of Root
		expect(tree.children.length).toBe(2);

		const folder1 = tree.children.find((child) => child.getName() === 'Folder 1');
		expect(folder1).toBeDefined();
		expect(folder1?.getId()).toBe('1');
		expect(folder1?.getName()).toBe('Folder 1');
		expect(folder1?.getUrl()).toBeNull();
		expect(folder1?.getFullPathSegments()).toEqual(['Folder 1']);
		expect(folder1?.getFullPath().toString()).toBe('/Folder 1');
		expect(folder1?.isRoot()).toBe(false);
		expect(folder1?.isFolder()).toBe(true);
		expect(folder1?.isTerminal()).toBe(false);

		const bookmark2 = tree.children.find((child) => child.getName() === 'Bookmark 2');
		expect(bookmark2).toBeDefined();
		expect(bookmark2?.getId()).toBe('5');
		expect(bookmark2?.getName()).toBe('Bookmark 2');
		expect(bookmark2?.getUrl()).toBe('http://example.com/2');
		expect(bookmark2?.getFullPathSegments()).toEqual(['Bookmark 2']);
		expect(bookmark2?.getFullPath().toString()).toBe('/Bookmark 2');
		expect(bookmark2?.isRoot()).toBe(false);
		expect(bookmark2?.isFolder()).toBe(false);
		expect(bookmark2?.isTerminal()).toBe(true);

		// Children of Folder 1
		expect(folder1?.children.length).toBe(2);

		const bookmark11 = folder1?.children.find((child) => child.getName() === 'Bookmark 1-1');
		expect(bookmark11).toBeDefined();
		expect(bookmark11?.getId()).toBe('2');
		expect(bookmark11?.getName()).toBe('Bookmark 1-1');
		expect(bookmark11?.getUrl()).toBe('http://example.com/1-1');
		expect(bookmark11?.getFullPathSegments()).toEqual(['Folder 1', 'Bookmark 1-1']);
		expect(bookmark11?.getFullPath().toString()).toBe('/Folder 1/Bookmark 1-1');
		expect(bookmark11?.isRoot()).toBe(false);
		expect(bookmark11?.isFolder()).toBe(false);
		expect(bookmark11?.isTerminal()).toBe(true);

		const folder12 = folder1?.children.find((child) => child.getName() === 'Folder 1-2');
		expect(folder12).toBeDefined();
		expect(folder12?.getId()).toBe('3');
		expect(folder12?.getName()).toBe('Folder 1-2');
		expect(folder12?.getUrl()).toBeNull();
		expect(folder12?.getFullPathSegments()).toEqual(['Folder 1', 'Folder 1-2']);
		expect(folder12?.getFullPath().toString()).toBe('/Folder 1/Folder 1-2');
		expect(folder12?.isRoot()).toBe(false);
		expect(folder12?.isFolder()).toBe(true);
		expect(folder12?.isTerminal()).toBe(false);

		// Children of Folder 1-2
		expect(folder12?.children.length).toBe(1);

		const bookmark121 = folder12?.children.find((child) => child.getName() === 'Bookmark 1-2-1');
		expect(bookmark121).toBeDefined();
		expect(bookmark121?.getId()).toBe('4');
		expect(bookmark121?.getName()).toBe('Bookmark 1-2-1');
		expect(bookmark121?.getUrl()).toBe('http://example.com/1-2-1');
		expect(bookmark121?.getFullPathSegments()).toEqual([
			'Folder 1',
			'Folder 1-2',
			'Bookmark 1-2-1'
		]);
		expect(bookmark121?.getFullPath().toString()).toBe('/Folder 1/Folder 1-2/Bookmark 1-2-1');
		expect(bookmark121?.isRoot()).toBe(false);
		expect(bookmark121?.isFolder()).toBe(false);
		expect(bookmark121?.isTerminal()).toBe(true);
	});

	it('ignore dangling nodes without valid parents', () => {
		const danglingNode = new TestNodeData({
			id: 'dangling',
			parentId: 'non-existent',
			name: 'Dangling Node',
			url: null,
			isFolder: true
		});
		expect(() => TreeNode.createTree(rootData, [...exampleData, danglingNode])).not.toThrowError();
	});

	it('dfs() should traverse all nodes in depth-first order', () => {
		const names: string[] = [];
		tree.dfs((node) => {
			names.push(node.getName() || '');
		});
		expect(names).toEqual([
			'/',
			'Folder 1',
			'Bookmark 1-1',
			'Folder 1-2',
			'Bookmark 1-2-1',
			'Bookmark 2'
		]);
	});

	it('toMap() should return correct path map', () => {
		const pathMap = tree.toMap();
		expect(pathMap.size).toBe(6);
		expect(Array.from(pathMap.keys()).map((path) => path.toString())).toEqual([
			'/',
			'/Folder 1',
			'/Folder 1/Bookmark 1-1',
			'/Folder 1/Folder 1-2',
			'/Folder 1/Folder 1-2/Bookmark 1-2-1',
			'/Bookmark 2'
		]);
	});

	it('toMap() with onlyTerminal=true should return path map with only terminal nodes', () => {
		const pathMap = tree.toMap({ onlyTerminal: true });
		expect(pathMap.size).toBe(3);

		const bookmark121Path = new Path({ pathString: '/Folder 1/Folder 1-2/Bookmark 1-2-1' });
		const bookmark121Node = pathMap.get(bookmark121Path);
		expect(bookmark121Node).toBeDefined();
		expect(bookmark121Node?.getName()).toBe('Bookmark 1-2-1');

		const bookmark11Path = new Path({ pathString: '/Folder 1/Bookmark 1-1' });
		const bookmark11Node = pathMap.get(bookmark11Path);
		expect(bookmark11Node).toBeDefined();
		expect(bookmark11Node?.getName()).toBe('Bookmark 1-1');

		const bookmark2Path = new Path({ pathString: '/Bookmark 2' });
		const bookmark2Node = pathMap.get(bookmark2Path);
		expect(bookmark2Node).toBeDefined();
		expect(bookmark2Node?.getName()).toBe('Bookmark 2');
	});

	it('toMap() should throw PathConflictError if conflicting paths given', () => {
		const tree = TreeNode.createTree(rootData, [
			new TestNodeData({
				id: '1',
				parentId: null,
				name: 'Conflict',
				url: null,
				isFolder: true
			}),
			new TestNodeData({
				id: '2',
				parentId: null,
				name: 'Conflict',
				url: null,
				isFolder: true
			})
		]);
		expect(() => {
			tree.toMap();
		}).toThrowError(PathConflictError);
	});
});
