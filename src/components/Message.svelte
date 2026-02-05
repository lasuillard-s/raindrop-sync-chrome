<script lang="ts">
	import { Toast } from 'flowbite-svelte';
	import {
		CheckCircleSolid,
		CloseCircleSolid,
		ExclamationCircleSolid
	} from 'flowbite-svelte-icons';
	import type { Component } from 'svelte';
	import { dismissMessage, type Message } from '~/lib/messages';

	const messageStyles: {
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

	interface Props {
		message?: Message;
	}
	let { message }: Props = $props();
</script>

{#if message}
	{@const color = messageStyles[message.type].color}
	{@const Icon = messageStyles[message.type].icon}
	<Toast {color} onclose={() => dismissMessage(message.id)}>
		{#snippet icon()}
			<Icon class="h-5 w-5" />
		{/snippet}
		{message.message}
	</Toast>
{/if}
