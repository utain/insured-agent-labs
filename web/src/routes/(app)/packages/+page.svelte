<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatBaht } from '$lib/format';

	let { data } = $props();
</script>

<svelte:head><title>Packages · InsureAgentLabs</title></svelte:head>

<div data-testid="packages-page" class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">Packages</h1>
			<p class="mt-1 text-sm text-slate-600">Reusable plan bundles to present to customers.</p>
		</div>
		<a href="/packages/new" class="btn-primary" data-testid="package-new-button">New package</a>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.packages as pkg (pkg.id)}
			<div class="card flex flex-col p-5" data-testid="package-card">
				<div class="flex items-start justify-between gap-2">
					<h2 class="font-semibold text-slate-900">{pkg.name}</h2>
					{#if pkg.agent_id === null}
						<span class="badge bg-slate-100 text-slate-500">Template</span>
					{/if}
				</div>
				<p class="mt-1 flex-1 text-sm text-slate-500">{pkg.description}</p>
				<dl class="mt-3 space-y-1 text-xs text-slate-500">
					<div class="flex justify-between">
						<dt>Base plan</dt>
						<dd class="font-medium text-slate-700">{pkg.base_product_code}</dd>
					</div>
					<div class="flex justify-between">
						<dt>Sum insured</dt>
						<dd class="font-medium text-slate-700">{formatBaht(pkg.default_sum_assured)}</dd>
					</div>
					<div class="flex justify-between">
						<dt>Riders</dt>
						<dd class="font-medium text-slate-700">{pkg.riders.length}</dd>
					</div>
				</dl>
				{#if pkg.agent_id !== null}
					<div class="mt-4 flex gap-2">
						<a href="/packages/{pkg.id}" class="btn-secondary flex-1 px-3 py-1.5 text-xs">Edit</a>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={pkg.id} />
							<button
								type="submit"
								class="btn-danger px-3 py-1.5 text-xs"
								data-testid="package-delete">Delete</button
							>
						</form>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
