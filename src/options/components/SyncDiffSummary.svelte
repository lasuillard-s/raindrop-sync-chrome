<script lang="ts">
	import type { SyncDiff } from '$lib/sync';
	import { Accordion, AccordionItem, P } from 'flowbite-svelte';
	import {
		CheckCircleSolid,
		CircleMinusSolid,
		CirclePlusSolid,
		ExclamationCircleSolid
	} from 'flowbite-svelte-icons';
	import PathBreadcrumb from '~/components/PathBreadcrumb.svelte';

	interface Props {
		diff: SyncDiff;
	}

	interface DiffSection {
		id: string;
		label: string;
		description: string;
		count: number;
		headerClass: string;
		cardClass: string;
		iconClass: string;
		emptyMessage: string;
		icon: typeof CirclePlusSolid;
		items: string[][];
	}

	let { diff }: Props = $props();

	const sections: DiffSection[] = $derived([
		{
			id: 'add',
			label: 'Add',
			description: 'Items to be added',
			count: diff.onlyInLeft.length,
			headerClass: 'text-green-800',
			cardClass: 'border-green-200 bg-green-50',
			iconClass: 'text-green-600',
			emptyMessage: 'No items to add',
			icon: CirclePlusSolid,
			items: diff.onlyInLeft.map((node) => node.getPath().getSegments())
		},
		{
			id: 'remove',
			label: 'Remove',
			description: 'Items to be removed',
			count: diff.onlyInRight.length,
			headerClass: 'text-red-800',
			cardClass: 'border-red-200 bg-red-50',
			iconClass: 'text-red-600',
			emptyMessage: 'No items to remove',
			icon: CircleMinusSolid,
			items: diff.onlyInRight.map((node) => node.getPath().getSegments())
		},
		{
			id: 'update',
			label: 'Update',
			description: 'Items to be updated',
			count: diff.inBothButDifferent.length,
			headerClass: 'text-orange-800',
			cardClass: 'border-orange-200 bg-orange-50',
			iconClass: 'text-orange-600',
			emptyMessage: 'No items to update',
			icon: ExclamationCircleSolid,
			items: diff.inBothButDifferent.map((pair) => pair.left.getPath().getSegments())
		},
		{
			id: 'unchanged',
			label: 'No Change',
			description: 'Items unchanged',
			count: diff.unchanged.length,
			headerClass: 'text-gray-800',
			cardClass: 'border-gray-200 bg-gray-50',
			iconClass: 'text-gray-600',
			emptyMessage: 'No unchanged items',
			icon: CheckCircleSolid,
			items: diff.unchanged.map((pair) => pair.left.getPath().getSegments())
		}
	]);
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
	{#each sections as section (section.id)}
		{@const Icon = section.icon}
		<div class={`rounded-lg border p-3 ${section.cardClass}`}>
			<div class="mb-2 flex items-center gap-2">
				<Icon class={section.iconClass} size="sm" />
				<P class={`font-medium ${section.headerClass}`}>{section.label}</P>
			</div>
			<P class={`text-2xl font-bold ${section.iconClass}`}>{section.count}</P>
			<P class={`mb-3 text-sm ${section.headerClass}`}>{section.description}</P>
			<Accordion>
				<AccordionItem>
					{#snippet header()}
						<div class={`text-sm font-medium ${section.headerClass}`}>
							View details ({section.count} items)
						</div>
					{/snippet}
					{#if section.items.length > 0}
						<div class="max-h-75 space-y-2 overflow-y-auto">
							{#each section.items as pathSegments, index (`${section.id}-${index}`)}
								<PathBreadcrumb {pathSegments} />
							{/each}
						</div>
					{:else}
						<P class="text-sm text-gray-500 italic">{section.emptyMessage}</P>
					{/if}
				</AccordionItem>
			</Accordion>
		</div>
	{/each}
</div>
