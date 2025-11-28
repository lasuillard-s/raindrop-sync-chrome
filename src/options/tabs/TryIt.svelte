<script lang="ts">
	import { Button, ButtonGroup, Input, Label, P, Textarea } from 'flowbite-svelte';
	import rd from '~/lib/raindrop';

	let query = '';
	let queryResult: unknown = null;
	$: queryResultJSON = JSON.stringify(queryResult, null, 4);

	/** Send query to fetch raindrops. */
	async function sendQuery() {
		const result = await rd.raindrop.getRaindrops(0, undefined, 5, 0, query);
		queryResult = result;
	}
</script>

<div>
	<P data-testid="description">Try Raindrop queries.</P>
	<div class="mt-4">
		<div>
			<Label for="query">Query</Label>
			<ButtonGroup class="w-full">
				<Input
					data-testid="query/input"
					id="query"
					type="text"
					placeholder="#python #dev:tools"
					bind:value={query}
				/>
				<Button data-testid="query/send-button" onclick={sendQuery}>Send</Button>
			</ButtonGroup>
		</div>
		<Textarea data-testid="query/result" class="mt-2" value={queryResultJSON} rows={20} />
	</div>
</div>
