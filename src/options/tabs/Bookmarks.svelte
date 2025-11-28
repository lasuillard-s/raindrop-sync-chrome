<script lang="ts">
	import { generated, utils } from '@lasuillard/raindrop-client';
	import { Button, P } from 'flowbite-svelte';
	import Tree from '~/components/Tree.svelte';
	import rd from '~/lib/raindrop';
	import { syncBookmarks } from '~/lib/sync';

	let treeNode: utils.tree.TreeNode<generated.Collection | null>;

	const fetchItems = async () => {
		treeNode = await rd.collection.getCollectionTree();
	};

	const createBookmarks = async () => {
		if (!treeNode) {
			console.log('Data not loaded yet');
			return;
		}

		await syncBookmarks({ treeNode });
	};
</script>

<div>
	<P data-testid="description">Bookmarks synchronization settings.</P>
	<div class="mt-2 space-x-2">
		<Button outline onclick={fetchItems}>Fetch</Button>
		<Button outline onclick={createBookmarks}>Synchronize</Button>
	</div>
	<div class="mt-2 p-2">
		{#if treeNode}
			<Tree {treeNode}></Tree>
		{:else}
			<P>No data received yet</P>
		{/if}
	</div>
</div>
