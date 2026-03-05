<script lang="ts">
	import { Button, ButtonGroup, Heading, Input, Label, P, Textarea } from 'flowbite-svelte';
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
	<div class="space-y-6">
		<!-- Query Testing Section -->
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div class="mb-6 border-b border-gray-200 pb-4">
				<Heading tag="h4" class="text-xl font-bold text-gray-900">Test Raindrop Queries</Heading>
				<P class="mt-2 text-sm text-gray-600" data-testid="description">
					Test and explore Raindrop.io API queries. Enter a search query to fetch raindrops.
				</P>
			</div>

			<!-- Query Input -->
			<div class="mb-6">
				<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
					<P class="mb-2 text-sm font-semibold text-blue-900">🔍 Search Query</P>
					<P class="mb-3 text-xs text-blue-700">
						Use Raindrop.io search syntax. Examples: #python, #dev:tools, type:link
					</P>
					<div>
						<Label for="query" class="mb-2 text-sm font-medium">Query</Label>
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
				</div>
			</div>

			<!-- Query Results -->
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
				<P class="mb-2 text-sm font-semibold text-gray-700">📋 Results</P>
				<P class="mb-3 text-xs text-gray-600">JSON response from the Raindrop.io API</P>
				<Textarea
					data-testid="query/result"
					class="w-full font-mono text-xs"
					value={queryResultJSON}
					rows={20}
					readonly
				/>
			</div>
		</div>
	</div>
</div>
