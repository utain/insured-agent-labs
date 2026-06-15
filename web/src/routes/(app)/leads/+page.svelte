<script lang="ts">
	import { formatDate, statusBadgeClass } from '$lib/format';

	let { data } = $props();
</script>

<svelte:head><title>Leads · InsureAgentLabs</title></svelte:head>

<div data-testid="leads-list-page" class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 data-testid="leads-list-page-title" class="text-2xl font-bold text-slate-900">
				Leads &amp; customers
			</h1>
			<p class="mt-1 text-sm text-slate-600">Everyone in your book of business.</p>
		</div>
		<a href="/leads/new" class="btn-primary" data-testid="leads-new-button">New lead</a>
	</div>

	{#if data.leads.length === 0}
		<div
			data-testid="leads-empty-state"
			role="status"
			class="card border-dashed p-12 text-center text-slate-500"
		>
			No leads yet. Add your first one.
		</div>
	{:else}
		<div class="card overflow-hidden">
			<table data-testid="leads-table" class="w-full text-left text-sm">
				<thead class="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
					<tr>
						<th class="px-4 py-3">Name</th>
						<th class="px-4 py-3">Occupation</th>
						<th class="px-4 py-3">Status</th>
						<th class="px-4 py-3">Added</th>
						<th class="px-4 py-3 text-right">Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.leads as lead (lead.id)}
						<tr data-testid="leads-table-row" data-lead-id={lead.id}>
							<td class="px-4 py-3 font-medium text-slate-900">{lead.full_name}</td>
							<td class="px-4 py-3 text-slate-600">{lead.occupation ?? '—'}</td>
							<td class="px-4 py-3">
								<span class="badge capitalize {statusBadgeClass(lead.status)}">{lead.status}</span>
							</td>
							<td class="px-4 py-3 text-slate-500">{formatDate(lead.created_at)}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex justify-end gap-2">
									<a href="/leads/{lead.id}" class="btn-secondary px-3 py-1.5 text-xs">View</a>
									<a
										href="/quotations/new?leadId={lead.id}"
										class="btn-primary px-3 py-1.5 text-xs"
										data-testid="leads-quote-button">Quote</a
									>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
