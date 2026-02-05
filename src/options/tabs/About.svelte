<script lang="ts">
	import { A, Heading, P } from 'flowbite-svelte';

	const getSelf = () => chrome.management.getSelf();
</script>

<div>
	<div class="space-y-6">
		<!-- Extension Information Section -->
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div class="mb-6 border-b border-gray-200 pb-4">
				<Heading tag="h4" class="text-xl font-bold text-gray-900">About This Extension</Heading>
				<P class="mt-2 text-sm text-gray-600">
					View extension information, version details, and related links
				</P>
			</div>

			{#await getSelf() then self}
				<!-- Extension Details -->
				<div class="mb-6">
					<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
						<P class="mb-2 text-sm font-semibold text-blue-900">📦 Extension Details</P>
						<div class="space-y-2">
							<div class="flex items-baseline gap-2">
								<P class="text-sm font-medium text-blue-900">Name:</P>
								<P class="text-sm text-blue-700">{self.name}</P>
							</div>
							<div class="flex items-baseline gap-2">
								<P class="text-sm font-medium text-blue-900">Version:</P>
								<P class="text-sm text-blue-700">v{self.version}</P>
							</div>
							{#if self.description}
								<div class="flex items-baseline gap-2">
									<P class="text-sm font-medium text-blue-900">Description:</P>
									<P class="text-sm text-blue-700">{self.description}</P>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Links Section -->
				<div>
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<P class="mb-2 text-sm font-semibold text-gray-700">🔗 Links</P>
						<div class="space-y-2">
							{#if self.homepageUrl}
								<div>
									<A
										href={self.homepageUrl}
										target="_blank"
										class="text-sm font-medium hover:underline"
									>
										🏠 Project Homepage
									</A>
								</div>
							{/if}
							<div>
								<A
									href="https://raindrop.io"
									target="_blank"
									class="text-sm font-medium hover:underline"
								>
									💧 Raindrop.io
								</A>
							</div>
						</div>
					</div>
				</div>
			{/await}
		</div>
	</div>
</div>
