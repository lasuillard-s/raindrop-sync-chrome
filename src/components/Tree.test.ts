// @vitest-environment happy-dom
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { NodeData, TreeNode } from '~/lib/sync/tree';
import Tree from './Tree.svelte';

// NodeData implementation for testing
// NOTE: Copied from src/lib/sync/tree.test.ts; if need to copy once more, refactor to a common test utils file.
class TestNodeData extends NodeData {
	private _id: string;
	private _parentId: string | null;
	private _name: string;
	private _url: string | null;
	private _isFolder: boolean;

	constructor(props: {
		id: string;
		parentId: string | null;
		name: string;
		url: string | null;
		isFolder: boolean;
	}) {
		super();
		this._id = props.id;
		this._parentId = props.parentId;
		this._name = props.name;
		this._url = props.url;
		this._isFolder = props.isFolder;
	}

	getId(): string {
		return this._id;
	}
	getParentId(): string | null {
		return this._parentId;
	}
	getHash(): string {
		return this._id;
	}
	getName(): string {
		return this._name;
	}
	getUrl(): string | null {
		return this._url;
	}
	isFolder(): boolean {
		return this._isFolder;
	}
}

let rootData: NodeData;
let exampleData: NodeData[];
let tree: TreeNode<NodeData>;

beforeEach(() => {
	/* Example data structure:

    Root (2)
    ├── Folder 1 (2)
    │   ├── Bookmark 1-1
    │   └── Folder 1-2 (1)
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

it('should render tree with children nodes recursively', async () => {
	const { queryByTestId } = render(Tree, {
		props: {
			treeNode: tree,
			propagatingDefaults: {
				collapsed: false
			}
		}
	});
	expect(queryByTestId('/')).toBeTruthy();
	expect(queryByTestId('/Folder 1')).toBeTruthy();
	expect(queryByTestId('/Folder 1/Bookmark 1-1')).toBeTruthy();
	expect(queryByTestId('/Folder 1/Folder 1-2')).toBeTruthy();
	expect(queryByTestId('/Folder 1/Folder 1-2/Bookmark 1-2-1')).toBeTruthy();
	expect(queryByTestId('/Bookmark 2')).toBeTruthy();
});

it('should render bookmark nodes with links and folders without links', () => {
	const { getByTestId, queryByTestId } = render(Tree, {
		props: {
			treeNode: tree,
			propagatingDefaults: {
				collapsed: false
			}
		}
	});

	const rootLink = queryByTestId('/::link');
	expect(rootLink).toBeNull();

	const folder1Link = queryByTestId('/Folder 1::link');
	expect(folder1Link).toBeNull();

	const bookmark11Link = getByTestId('/Folder 1/Bookmark 1-1::link');
	expect(bookmark11Link?.getAttribute('href')).toBe('http://example.com/1-1');

	const folder12Link = queryByTestId('/Folder 1/Folder 1-2::link');
	expect(folder12Link).toBeNull();

	const bookmark121Link = getByTestId('/Folder 1/Folder 1-2/Bookmark 1-2-1::link');
	expect(bookmark121Link?.getAttribute('href')).toBe('http://example.com/1-2-1');

	const bookmark2Link = getByTestId('/Bookmark 2::link');
	expect(bookmark2Link?.getAttribute('href')).toBe('http://example.com/2');
});

it('should display node title from nodeTitleOverride or treeNode.getName()', () => {
	const { getByTestId } = render(Tree, {
		props: {
			treeNode: tree,
			nodeTitleOverride: 'Custom Root Title',
			collapsed: false
		}
	});

	// Root node with overridden title
	const rootNode = getByTestId('/');
	expect(rootNode.textContent).toContain('Custom Root Title');

	// Folder 1 node shouldn't be affected by root override
	const folder1Node = getByTestId('/Folder 1');
	expect(folder1Node.textContent).not.toContain('Custom Root Title');
	expect(folder1Node.textContent).toContain('Folder 1');
});

it('should show/hide children with collapse toggle', async () => {
	const user = userEvent.setup();
	const { getByTestId, queryByTestId } = render(Tree, {
		props: {
			treeNode: tree,
			// Start root collapsed to test toggle with root
			collapsed: true
		}
	});
	const rootToggleButton = getByTestId('/::toggle');

	// Initially, root is collapsed, so Folder 1 and Bookmark 2 should not be visible
	expect(queryByTestId('/Folder 1')).toBeNull();
	expect(queryByTestId('/Bookmark 2')).toBeNull();

	// Click to expand root
	await user.click(rootToggleButton);
	expect(queryByTestId('/')).toBeTruthy();
	expect(queryByTestId('/Folder 1')).toBeTruthy();

	// Folder 1 is still collapsed, so its children should not be visible
	expect(queryByTestId('/Folder 1/Bookmark 1-1')).toBeFalsy();
	expect(queryByTestId('/Folder 1/Folder 1-2')).toBeFalsy();
	expect(queryByTestId('/Folder 1/Folder 1-2/Bookmark 1-2-1')).toBeFalsy();

	expect(queryByTestId('/Bookmark 2')).toBeTruthy();

	// Click to collapse root again
	await user.click(rootToggleButton);
	expect(queryByTestId('/Folder 1')).toBeNull();
	expect(queryByTestId('/Bookmark 2')).toBeNull();
});
