<script lang="ts">
	import { FloatingLabelInput } from 'flowbite-svelte';
	import { EyeSlashSolid, EyeSolid } from 'flowbite-svelte-icons';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		value?: string;
	}
	let { children, value = $bindable() }: Props = $props();
	let showSecret = $state(false);
</script>

<div class="flex">
	<FloatingLabelInput
		class="mr-2 w-full"
		type={showSecret ? 'text' : 'password'}
		required
		bind:value
	>
		{@render children?.()}
	</FloatingLabelInput>
	<button
		class="focus:outline-hidden"
		type="button"
		onclick={() => {
			showSecret = !showSecret;
		}}
	>
		{#if showSecret}
			<EyeSolid size="sm" />
		{:else}
			<EyeSlashSolid size="sm" />
		{/if}
	</button>
</div>
