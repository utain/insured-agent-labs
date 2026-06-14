<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();
</script>

<svelte:head><title>{m['leads.title']()} · {m['app.title']()}</title></svelte:head>

<div data-testid="leads-list-page">
	<div class="flex items-center justify-between mb-6">
		<h1 data-testid="leads-list-page-title" class="text-2xl font-bold text-slate-900">
			{m['leads.title']()}
		</h1>
		<a
			href="/leads/new"
			data-testid="leads-new-button"
			class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>
			{m['leads.new']()}
		</a>
	</div>

	{#if data.leads.length === 0}
		<div
			data-testid="leads-empty-state"
			role="status"
			class="text-center py-12 bg-white rounded-xl border border-slate-200"
		>
			<p class="text-slate-500">{m['leads.empty']()}</p>
		</div>
	{:else}
		<div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
			<table data-testid="leads-table" class="w-full">
				<thead class="bg-slate-50 text-xs text-slate-500 uppercase">
					<tr>
						<th class="px-4 py-3 text-left">{m['leads.full_name.label']()}</th>
						<th class="px-4 py-3 text-left">{m['leads.phone.label']()}</th>
						<th class="px-4 py-3 text-left">Status</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each data.leads as lead (lead.id)}
						<tr data-testid="leads-table-row-{lead.id}">
							<td class="px-4 py-3 text-sm text-slate-900">{lead.full_name}</td>
							<td class="px-4 py-3 text-sm text-slate-600">{lead.phone}</td>
							<td class="px-4 py-3 text-sm text-slate-600">{lead.status}</td>
							<td class="px-4 py-3 text-right">
								<a
									href="/leads/{lead.id}"
									data-testid="leads-view-button-{lead.id}"
									class="text-sm text-slate-600 hover:text-slate-900"
								>
									View
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
