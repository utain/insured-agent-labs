<script lang="ts">
	import { formatDate, statusBadgeClass } from '$lib/format';

	let { data } = $props();
	const lead = $derived(data.lead);

	const rows = $derived([
		['Date of birth', `${lead.dob} · age ${data.lead ? ageOf(lead.dob) : ''}`],
		['Gender', lead.gender],
		['Occupation', lead.occupation ?? '—'],
		['National ID', lead.national_id ?? '—'],
		['Phone', lead.phone ?? '—'],
		['Email', lead.email ?? '—']
	]);

	function ageOf(dob: string): number {
		const d = new Date(dob);
		return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
	}
</script>

<svelte:head><title>{lead.full_name} · InsureAgentLabs</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-6" data-testid="lead-detail-page">
	<a href="/leads" class="text-sm text-slate-500 hover:underline">← Back to leads</a>

	<div class="flex items-center justify-between">
		<div>
			<h1 data-testid="lead-detail-page-title" class="text-2xl font-bold text-slate-900">
				{lead.full_name}
			</h1>
			<span
				class="badge mt-1 capitalize {statusBadgeClass(lead.status)}"
				data-testid="lead-detail-status">{lead.status}</span
			>
		</div>
		<a
			href="/quotations/new?leadId={lead.id}"
			class="btn-primary"
			data-testid="lead-start-quotation-button">Start quotation</a
		>
	</div>

	<dl class="card divide-y divide-slate-100">
		{#each rows as [label, value] (label)}
			<div class="flex justify-between gap-4 px-5 py-3">
				<dt class="text-sm text-slate-500">{label}</dt>
				<dd class="text-right text-sm font-medium text-slate-900 capitalize">{value}</dd>
			</div>
		{/each}
	</dl>

	<section>
		<h2 class="mb-2 text-lg font-semibold text-slate-900">Quotations</h2>
		{#if data.quotations.length === 0}
			<p class="card p-6 text-sm text-slate-500">No quotations yet for this lead.</p>
		{:else}
			<div class="card divide-y divide-slate-100">
				{#each data.quotations as q (q.id)}
					<a
						href={q.status === 'illustrated' && q.illustration_id
							? `/illustrations/${q.illustration_id}`
							: `/quotations/${q.id}`}
						class="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
					>
						<div>
							<div class="text-sm font-medium text-slate-900">
								{q.base_product_code ?? 'Draft'} · {formatDate(q.created_at)}
							</div>
							<div class="text-xs text-slate-500">
								{q.calc ? `฿${q.calc.total_annual_premium.toLocaleString()}/yr` : 'No premium yet'}
							</div>
						</div>
						<span class="badge capitalize {statusBadgeClass(q.status)}">{q.status}</span>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>
