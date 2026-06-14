<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();
	const lead = $derived(data.lead);

	const genderLabel = (g: string) =>
		g === 'male'
			? m['leads.gender.male']()
			: g === 'female'
				? m['leads.gender.female']()
				: m['leads.gender.other']();

	const formatBaht = (n: number | null) => (n != null ? '฿' + n.toLocaleString() : '—');
</script>

<svelte:head><title>{m['leads.detail.title']()} · {m['app.title']()}</title></svelte:head>

<div class="max-w-2xl mx-auto" data-testid="lead-detail-page">
	<a href="/leads" class="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">
		← {m['leads.detail.back']()}
	</a>
	<h1 data-testid="lead-detail-page-title" class="text-2xl font-bold text-slate-900 mb-6">
		{m['leads.detail.title']()}
	</h1>

	<dl class="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
		<div class="px-5 py-3 flex justify-between gap-4">
			<dt class="text-sm text-slate-500" data-testid="lead-detail-full-name-label">
				{m['leads.full_name.label']()}
			</dt>
			<dd class="text-sm font-medium text-slate-900 text-right" data-testid="lead-detail-full-name">
				{lead.full_name}
			</dd>
		</div>
		<div class="px-5 py-3 flex justify-between gap-4">
			<dt class="text-sm text-slate-500">{m['leads.national_id.label']()}</dt>
			<dd
				class="text-sm font-medium text-slate-900 text-right"
				data-testid="lead-detail-national-id"
			>
				{lead.national_id}
			</dd>
		</div>
		<div class="px-5 py-3 flex justify-between gap-4">
			<dt class="text-sm text-slate-500">{m['leads.dob.label']()}</dt>
			<dd class="text-sm font-medium text-slate-900 text-right" data-testid="lead-detail-dob">
				{lead.dob}
			</dd>
		</div>
		<div class="px-5 py-3 flex justify-between gap-4">
			<dt class="text-sm text-slate-500">{m['leads.gender.label']()}</dt>
			<dd class="text-sm font-medium text-slate-900 text-right" data-testid="lead-detail-gender">
				{genderLabel(lead.gender)}
			</dd>
		</div>
		<div class="px-5 py-3 flex justify-between gap-4">
			<dt class="text-sm text-slate-500">{m['leads.phone.label']()}</dt>
			<dd class="text-sm font-medium text-slate-900 text-right" data-testid="lead-detail-phone">
				{lead.phone}
			</dd>
		</div>
		<div class="px-5 py-3 flex justify-between gap-4">
			<dt class="text-sm text-slate-500">{m['leads.email.label']()}</dt>
			<dd class="text-sm font-medium text-slate-900 text-right" data-testid="lead-detail-email">
				{lead.email ?? '—'}
			</dd>
		</div>
		<div class="px-5 py-3 flex justify-between gap-4">
			<dt class="text-sm text-slate-500">{m['leads.occupation.label']()}</dt>
			<dd
				class="text-sm font-medium text-slate-900 text-right"
				data-testid="lead-detail-occupation"
			>
				{lead.occupation ?? '—'}
			</dd>
		</div>
		<div class="px-5 py-3 flex justify-between gap-4">
			<dt class="text-sm text-slate-500">{m['leads.income.label']()}</dt>
			<dd class="text-sm font-medium text-slate-900 text-right" data-testid="lead-detail-income">
				{formatBaht(lead.income)}
			</dd>
		</div>
		<div class="px-5 py-3 flex justify-between gap-4">
			<dt class="text-sm text-slate-500">Status</dt>
			<dd class="text-sm font-medium text-slate-900 text-right" data-testid="lead-detail-status">
				{lead.status}
			</dd>
		</div>
	</dl>

	<div class="mt-6 flex gap-3">
		<!-- Will be wired in Phase 3 -->
		<a
			href="/quotations/new?leadId={lead.id}"
			data-testid="lead-start-quotation-button"
			class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
		>
			{m['leads.detail.start_quotation']()}
		</a>
		<!-- TODO: edit (Phase later) -->
	</div>
</div>
