// @vitest-environment happy-dom
import { TestTreeNode } from '@test-helpers/tree';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import Tree from '~/components/Tree.svelte';

let tree: TestTreeNode;

beforeEach(() => {
	/* Example data structure:

    Root (2)
    ├── Folder 1 (2)
    │   ├── Bookmark 1-1
    │   └── Folder 1-2 (1)
    │       └── Bookmark 1-2-1
    └── Bookmark 2
    */
	tree = new TestTreeNode({
		id: 'root',
		title: '',
		url: null,
		type: 'folder'
	});
	const folder1 = new TestTreeNode({
		id: '1',
		title: 'Folder 1',
		url: null,
		type: 'folder',
		parent: tree
	});

	new TestTreeNode({
		id: '2',
		title: 'Bookmark 1-1',
		url: 'http://example.com/1-1',
		type: 'bookmark',
		parent: folder1
	});

	const folder12 = new TestTreeNode({
		id: '3',
		title: 'Folder 1-2',
		url: null,
		type: 'folder',
		parent: folder1
	});

	new TestTreeNode({
		id: '4',
		title: 'Bookmark 1-2-1',
		url: 'http://example.com/1-2-1',
		type: 'bookmark',
		parent: folder12
	});

	new TestTreeNode({
		id: '5',
		title: 'Bookmark 2',
		url: 'http://example.com/2',
		type: 'bookmark',
		parent: tree
	});
});

it('should render tree with children nodes recursively', async () => {
	// Arrange
	const { queryByTestId } = render(Tree, {
		props: {
			treeNode: tree,
			propagatingDefaults: {
				collapsed: false
			}
		}
	});

	// Assert
	expect(queryByTestId('/')).toBeTruthy();
	expect(queryByTestId('/Folder 1')).toBeTruthy();
	expect(queryByTestId('/Folder 1/Bookmark 1-1')).toBeTruthy();
	expect(queryByTestId('/Folder 1/Folder 1-2')).toBeTruthy();
	expect(queryByTestId('/Folder 1/Folder 1-2/Bookmark 1-2-1')).toBeTruthy();
	expect(queryByTestId('/Bookmark 2')).toBeTruthy();
});

it('should render bookmark nodes with links and folders without links', () => {
	// Arrange
	const { getByTestId, queryByTestId } = render(Tree, {
		props: {
			treeNode: tree,
			propagatingDefaults: {
				collapsed: false
			}
		}
	});

	// Assert
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
	// Arrange
	const { getByTestId } = render(Tree, {
		props: {
			treeNode: tree,
			nodeTitleOverride: 'Custom Root Title',
			collapsed: false
		}
	});

	// Assert
	// Root node with overridden title
	const rootNode = getByTestId('/');
	expect(rootNode.textContent).toContain('Custom Root Title');

	// Folder 1 node shouldn't be affected by root override
	const folder1Node = getByTestId('/Folder 1');
	expect(folder1Node.textContent).not.toContain('Custom Root Title');
	expect(folder1Node.textContent).toContain('Folder 1');
});

it('should show/hide children with collapse toggle', async () => {
	// Arrange
	const user = userEvent.setup();
	const { getByTestId, queryByTestId } = render(Tree, {
		props: {
			treeNode: tree,
			// Start root collapsed to test toggle with root
			collapsed: true
		}
	});
	const rootToggleButton = getByTestId('/::toggle');

	// Act + Assert
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
