import { SyncDiff } from './diff';
import { beforeEach, describe, expect, it } from 'vitest';
import { NodeData, TreeNode } from '~/lib/sync/tree';
import { RaindropNodeData } from '~/lib/raindrop';
import { ChromeBookmarkNodeData } from '~/lib/browser/chrome';

describe('SyncDiff', () => {
	let leftTree: TreeNode<RaindropNodeData>;
	let rightTree: TreeNode<ChromeBookmarkNodeData>;

	beforeEach(() => {
		// Build left tree (Raindrop)
		leftTree = new TreeNode<RaindropNodeData>({ data: null });

		const left_updateRaindrops = new TreeNode({
			data: new RaindropNodeData({
				_id: 57172486,
				title: 'updateRaindrops',
				description: '',
				user: { $ref: 'users', $id: 2067190 },
				public: false,
				view: 'list',
				count: 1,
				cover: [],
				sort: 0,
				expanded: true,
				creatorRef: { _id: 2067190, name: 'miyil99106', email: '' },
				lastAction: '2025-07-02T07:15:38.746Z',
				created: '2025-07-02T07:15:37.776Z',
				lastUpdate: '2025-07-02T07:15:38.746Z',
				parent: null,
				slug: 'update-raindrops',
				access: { for: 2067190, level: 4, root: false, draggable: true },
				author: true
			})
		});
		leftTree.addChild(left_updateRaindrops);

		const left_updateRaindrops_bookmark = new TreeNode({
			data: new RaindropNodeData({
				_id: 1210279714,
				link: 'https://raindrop.io',
				title: 'updateRaindrops',
				excerpt: '',
				note: '',
				type: 'link',
				user: { $ref: 'users', $id: 2067190 },
				cover: '',
				tags: ['rainy-days'],
				removed: false,
				collection: { $ref: 'collections', $id: 57172486, oid: 57172486 },
				media: [],
				created: '2025-07-02T07:15:38.175Z',
				lastUpdate: '2025-07-02T07:15:38.730Z',
				domain: 'raindrop.io',
				creatorRef: { _id: 2067190, name: 'miyil99106', avatar: '', email: '' },
				sort: 1210279714,
				highlights: [],
				collectionId: 57172486
			})
		});
		left_updateRaindrops.addChild(left_updateRaindrops_bookmark);

		const left_getHighlightsInCollection = new TreeNode({
			data: new RaindropNodeData({
				_id: 57172489,
				title: 'getHighlightsInCollection',
				description: '',
				user: { $ref: 'users', $id: 2067190 },
				public: false,
				view: 'list',
				count: 0,
				cover: [],
				sort: 0,
				expanded: true,
				creatorRef: { _id: 2067190, name: 'miyil99106', email: '' },
				lastAction: '2025-12-16T05:30:15.443Z',
				created: '2025-07-02T07:15:38.506Z',
				lastUpdate: '2025-12-16T05:30:15.444Z',
				parent: null,
				slug: 'get-highlights-in-collection',
				access: { for: 2067190, level: 4, root: false, draggable: true },
				author: true
			})
		});
		leftTree.addChild(left_getHighlightsInCollection);

		const left_shareCollection = new TreeNode({
			data: new RaindropNodeData({
				_id: 57172499,
				title: 'shareCollection',
				description: '',
				user: { $ref: 'users', $id: 2067190 },
				public: false,
				view: 'list',
				count: 0,
				cover: [],
				sort: 0,
				expanded: true,
				creatorRef: { _id: 2067190, name: 'miyil99106', email: '' },
				lastAction: '2025-07-02T07:15:46.143Z',
				created: '2025-07-02T07:15:46.143Z',
				lastUpdate: '2025-07-02T07:15:46.143Z',
				parent: null,
				slug: 'share-collection',
				access: { for: 2067190, level: 4, root: false, draggable: true },
				author: true
			})
		});
		leftTree.addChild(left_shareCollection);

		const left_github = new TreeNode({
			data: new RaindropNodeData({
				_id: 1491378920,
				link: 'https://github.com',
				excerpt:
					"Join the world's most widely adopted, AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.",
				note: '',
				type: 'link',
				user: { $ref: 'users', $id: 2067190 },
				cover:
					'https://images.ctfassets.net/8aevphvgewt8/4pe4eOtUJ0ARpZRE4fNekf/f52b1f9c52f059a33170229883731ed0/GH-Homepage-Universe-img.png',
				media: [
					{
						link: 'https://images.ctfassets.net/8aevphvgewt8/4pe4eOtUJ0ARpZRE4fNekf/f52b1f9c52f059a33170229883731ed0/GH-Homepage-Universe-img.png',
						type: 'image'
					}
				],
				tags: [],
				removed: false,
				collection: { $ref: 'collections', $id: -1, oid: -1 },
				highlights: [],
				created: '2025-12-16T05:32:04.883Z',
				lastUpdate: '2025-12-16T05:32:06.197Z',
				domain: 'github.com',
				title: 'GitHub · Change is constant. GitHub keeps you ahead.',
				creatorRef: { _id: 2067190, name: 'miyil99106', avatar: '', email: '' },
				sort: 1491378920,
				collectionId: -1
			})
		});
		leftTree.addChild(left_github);

		const left_raindropIo = new TreeNode({
			data: new RaindropNodeData({
				_id: 1210279722,
				link: 'https://raindrop.io',
				excerpt: '',
				note: '',
				type: 'link',
				user: { $ref: 'users', $id: 2067190 },
				cover:
					'https://t3.ftcdn.net/jpg/00/92/53/56/360_F_92535664_IvFsQeHjBzfE6sD4VHdO8u5OHUSc6yHF.jpg',
				media: [
					{
						link: 'https://t3.ftcdn.net/jpg/00/92/53/56/360_F_92535664_IvFsQeHjBzfE6sD4VHdO8u5OHUSc6yHF.jpg',
						type: 'image'
					}
				],
				tags: ['raindrop'],
				removed: false,
				collection: { $ref: 'collections', $id: -1, oid: -1 },
				highlights: [],
				created: '2025-07-02T07:15:40.097Z',
				lastUpdate: '2025-07-02T07:15:40.098Z',
				domain: 'raindrop.io',
				title: 'https://raindrop.io',
				creatorRef: { _id: 2067190, name: 'miyil99106', avatar: '', email: '' },
				sort: 1210279722,
				collectionId: -1
			})
		});
		leftTree.addChild(left_raindropIo);

		const left_getAllHighlights = new TreeNode({
			data: new RaindropNodeData({
				_id: 1210279712,
				link: 'https://raindrop.io',
				title: 'getAllHighlights',
				excerpt: '',
				note: '',
				type: 'link',
				user: { $ref: 'users', $id: 2067190 },
				cover: '',
				tags: [],
				removed: false,
				media: [],
				highlights: [
					{
						text: 'ignore',
						note: '',
						created: '2025-07-02T07:15:37.884Z',
						lastUpdate: '2025-07-02T07:15:37.885Z',
						creatorRef: 2067190,
						_id: '6864dc99f9cbdb7d1ee0f3ae'
					}
				],
				created: '2025-07-02T07:15:37.885Z',
				lastUpdate: '2025-07-02T07:15:37.885Z',
				domain: 'raindrop.io',
				collection: { $ref: 'collections', $id: -1, oid: -1 },
				creatorRef: { _id: 2067190, name: 'miyil99106', avatar: '', email: '' },
				sort: 1210279712,
				collectionId: -1
			})
		});
		leftTree.addChild(left_getAllHighlights);

		// Build right tree (Chrome)
		const right_root = new TreeNode({
			data: new ChromeBookmarkNodeData({
				dateAdded: 1768546076874,
				id: '0',
				syncing: false,
				title: ''
			})
		});

		rightTree = new TreeNode({
			data: new ChromeBookmarkNodeData({
				dateAdded: 1768200846043,
				dateGroupModified: 1768201707949,
				folderType: 'bookmarks-bar',
				id: '1',
				index: 0,
				parentId: '0',
				syncing: false,
				title: 'Bookmarks bar'
			})
		});
		right_root.addChild(rightTree);

		const right_updateRaindrops = new TreeNode({
			data: new ChromeBookmarkNodeData({
				dateAdded: 1768201707921,
				dateGroupModified: 1768201707926,
				id: '5',
				index: 0,
				parentId: '1',
				syncing: false,
				title: 'updateRaindrops'
			})
		});
		rightTree.addChild(right_updateRaindrops);

		const right_updateRaindrops_bookmark = new TreeNode({
			data: new ChromeBookmarkNodeData({
				dateAdded: 1768201707926,
				id: '6',
				index: 0,
				parentId: '5',
				syncing: false,
				title: 'updateRaindrops',
				url: 'https://raindrop.io/'
			})
		});
		right_updateRaindrops.addChild(right_updateRaindrops_bookmark);

		const right_github = new TreeNode({
			data: new ChromeBookmarkNodeData({
				dateAdded: 1768201707941,
				id: '7',
				index: 1,
				parentId: '1',
				syncing: false,
				title: 'GitHub · Change is constant. GitHub keeps you ahead.',
				url: 'https://github.com/'
			})
		});
		rightTree.addChild(right_github);

		const right_raindropIo = new TreeNode({
			data: new ChromeBookmarkNodeData({
				dateAdded: 1768201707944,
				id: '8',
				index: 2,
				parentId: '1',
				syncing: false,
				title: 'https://raindrop.io',
				// * Modified to test inBothButDifferent
				// url: 'https://raindrop.io/'
				url: 'https://raindrop.io/qs=hey'
			})
		});
		rightTree.addChild(right_raindropIo);

		// * Commented out to test onlyInLeft
		// const right_getAllHighlights = new TreeNode({
		// 	data: new ChromeBookmarkNodeData({
		// 		dateAdded: 1768201707949,
		// 		id: '9',
		// 		index: 3,
		// 		parentId: '1',
		// 		syncing: false,
		// 		title: 'getAllHighlights',
		// 		url: 'https://raindrop.io/'
		// 	}),
		// });
		// rightTree.addChild(right_getAllHighlights);

		// * Added to test onlyInRight
		const right_deleteMe = new TreeNode({
			data: new ChromeBookmarkNodeData({
				dateAdded: 1768201707949,
				id: '9',
				index: 3,
				parentId: '1',
				syncing: false,
				title: 'deleteMe',
				url: 'https://example.com/'
			})
		});
		rightTree.addChild(right_deleteMe);

		const right_otherBookmarks = new TreeNode({
			data: new ChromeBookmarkNodeData({
				dateAdded: 1768200846043,
				folderType: 'other',
				id: '2',
				index: 1,
				parentId: '0',
				syncing: false,
				title: 'Other bookmarks'
			})
		});
		right_root.addChild(right_otherBookmarks);
	});

	it('calculates differences between two tree structures', () => {
		const diff = SyncDiff.calculateDiff(leftTree, rightTree);
		const nodeToString = (node: TreeNode<NodeData>) => node.getFullPath().toString();
		expect(diff.onlyInLeft.map(nodeToString)).toEqual(['/getAllHighlights']);
		expect(diff.onlyInRight.map(nodeToString)).toEqual(['/Bookmarks bar/deleteMe']);
		expect(
			diff.unchanged.map((pair) => ({
				left: nodeToString(pair.left),
				right: nodeToString(pair.right)
			}))
		).toEqual([
			{
				left: '/updateRaindrops/updateRaindrops',
				right: '/Bookmarks bar/updateRaindrops/updateRaindrops'
			},
			{
				left: '/GitHub · Change is constant. GitHub keeps you ahead.',
				right: '/Bookmarks bar/GitHub · Change is constant. GitHub keeps you ahead.'
			}
		]);
		expect(
			diff.inBothButDifferent.map((pair) => ({
				left: nodeToString(pair.left),
				right: nodeToString(pair.right)
			}))
		).toEqual([{ left: '/https://raindrop.io', right: '/Bookmarks bar/https://raindrop.io' }]);
	});
});
