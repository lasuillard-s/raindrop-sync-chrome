<script lang="ts">
	import { Toast } from 'flowbite-svelte';
	import {
		CheckCircleSolid,
		CloseCircleSolid,
		ExclamationCircleSolid
	} from 'flowbite-svelte-icons';
	import type { Component } from 'svelte';
	import { dismissMessage, type Message } from '~/lib/messages';

	const messageMapping: {
		[type: string]: { icon: Component; color: 'blue' | 'green' | 'red' };
	} = {
		success: {
			icon: CheckCircleSolid,
			color: 'green'
		},
		info: {
			icon: ExclamationCircleSolid,
			color: 'blue'
		},
		error: {
			icon: CloseCircleSolid,
			color: 'red'
		}
	};

	export let message: Message;
</script>

{#if message}
	{@const color = messageMapping[message.type].color}
	{@const icon_ = messageMapping[message.type].icon}
	<div {...$$restProps}>
		<Toast {color} onclose={() => dismissMessage(message.id)}>
			{#snippet icon()}
				<svelte:component this={icon_} class="h-5 w-5" />
			{/snippet}
			{message.message}
		</Toast>
	</div>
{/if}
