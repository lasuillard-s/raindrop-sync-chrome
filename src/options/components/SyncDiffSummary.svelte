<script lang="ts">
	import PathBreadcrumb from '$components/PathBreadcrumb.svelte';
	import type { SyncDiff } from '$lib/sync';
	import { Accordion, AccordionItem, P } from 'flowbite-svelte';
	import {
		CheckCircleSolid,
		CircleMinusSolid,
		CirclePlusSolid,
		ExclamationCircleSolid
	} from 'flowbite-svelte-icons';

	interface Props {
		diff: SyncDiff;
	}
	let { diff }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<div class="rounded-lg border border-green-200 bg-green-50 p-3">
		<div class="mb-2 flex items-center gap-2">
			<CirclePlusSolid class="text-green-600" size="sm" />
			<P class="font-medium text-green-800">Add</P>
		</div>
		<P class="text-2xl font-bold text-green-600">{diff.onlyInLeft.length}</P>
		<P class="mb-3 text-sm text-green-800">Items to be added</P>
		<Accordion>
			<AccordionItem>
				{#snippet header()}
					<div class="text-sm font-medium text-green-800">
						View details ({diff.onlyInLeft.length} items)
					</div>
				{/snippet}
				{#if diff.onlyInLeft.length > 0}
					<div class="max-h-75 space-y-2 overflow-y-auto">
						{#each diff.onlyInLeft as node, index (`add-${index}`)}
							<PathBreadcrumb pathSegments={node.getPath().getSegments()} />
						{/each}
					</div>
				{:else}
					<P class="text-sm text-gray-500 italic">No items to add</P>
				{/if}
			</AccordionItem>
		</Accordion>
	</div>

	<div class="rounded-lg border border-red-200 bg-red-50 p-3">
		<div class="mb-2 flex items-center gap-2">
			<CircleMinusSolid class="text-red-600" size="sm" />
			<P class="font-medium text-red-800">Remove</P>
		</div>
		<P class="text-2xl font-bold text-red-600">{diff.onlyInRight.length}</P>
		<P class="mb-3 text-sm text-red-800">Items to be removed</P>
		<Accordion>
			<AccordionItem>
				{#snippet header()}
					<div class="text-sm font-medium text-red-800">
						View details ({diff.onlyInRight.length} items)
					</div>
				{/snippet}
				{#if diff.onlyInRight.length > 0}
					<div class="max-h-75 space-y-2 overflow-y-auto">
						{#each diff.onlyInRight as node, index (`remove-${index}`)}
							<PathBreadcrumb pathSegments={node.getPath().getSegments()} />
						{/each}
					</div>
				{:else}
					<P class="text-sm text-gray-500 italic">No items to remove</P>
				{/if}
			</AccordionItem>
		</Accordion>
	</div>

	<div class="rounded-lg border border-orange-200 bg-orange-50 p-3">
		<div class="mb-2 flex items-center gap-2">
			<ExclamationCircleSolid class="text-orange-600" size="sm" />
			<P class="font-medium text-orange-800">Update</P>
		</div>
		<P class="text-2xl font-bold text-orange-600">{diff.inBothButDifferent.length}</P>
		<P class="mb-3 text-sm text-orange-800">Items to be updated</P>
		<Accordion>
			<AccordionItem>
				{#snippet header()}
					<div class="text-sm font-medium text-orange-800">
						View details ({diff.inBothButDifferent.length} items)
					</div>
				{/snippet}
				{#if diff.inBothButDifferent.length > 0}
					<div class="max-h-75 space-y-2 overflow-y-auto">
						{#each diff.inBothButDifferent as pair, index (`update-${index}`)}
							<PathBreadcrumb pathSegments={pair.left.getPath().getSegments()} />
						{/each}
					</div>
				{:else}
					<P class="text-sm text-gray-500 italic">No items to update</P>
				{/if}
			</AccordionItem>
		</Accordion>
	</div>

	<div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
		<div class="mb-2 flex items-center gap-2">
			<CheckCircleSolid class="text-gray-600" size="sm" />
			<P class="font-medium text-gray-800">No Change</P>
		</div>
		<P class="text-2xl font-bold text-gray-600">{diff.unchanged.length}</P>
		<P class="mb-3 text-sm text-gray-800">Items unchanged</P>
		<Accordion>
			<AccordionItem>
				{#snippet header()}
					<div class="text-sm font-medium text-gray-800">
						View details ({diff.unchanged.length} items)
					</div>
				{/snippet}
				{#if diff.unchanged.length > 0}
					<div class="max-h-75 space-y-2 overflow-y-auto">
						{#each diff.unchanged as pair, index (`unchanged-${index}`)}
							<PathBreadcrumb pathSegments={pair.left.getPath().getSegments()} />
						{/each}
					</div>
				{:else}
					<P class="text-sm text-gray-500 italic">No unchanged items</P>
				{/if}
			</AccordionItem>
		</Accordion>
	</div>
</div>
