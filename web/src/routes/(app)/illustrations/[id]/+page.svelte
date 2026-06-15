<script lang="ts">
	import { formatBaht, formatDate } from '$lib/format';
	import { MODAL_LABELS } from '$lib/schemas';

	let { data } = $props();
	const si = $derived(data.illustration);
</script>

<svelte:head><title>{si.number} · Sales Illustration</title></svelte:head>

<div class="mx-auto max-w-3xl space-y-6" data-testid="illustration-page">
	<div class="no-print flex items-center justify-between">
		<a href="/" class="btn-ghost text-sm" data-testid="illustration-exit">← Dashboard</a>
		<div class="flex gap-2">
			<a href="/quotations/{si.quotation_id}" class="btn-secondary" data-testid="illustration-edit"
				>Back to edit</a
			>
			<button type="button" class="btn-primary" onclick={() => window.print()}>Print</button>
		</div>
	</div>

	<article class="card space-y-6 p-8">
		<header class="flex items-start justify-between border-b border-slate-200 pb-4">
			<div>
				<div class="flex items-center gap-2">
					<span
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white"
						>IA</span
					>
					<span class="text-lg font-bold text-slate-900">InsureAgentLabs</span>
				</div>
				<p class="mt-1 text-sm text-slate-500">Sales Illustration</p>
			</div>
			<div class="text-right">
				<div
					class="font-mono text-sm font-semibold text-slate-900"
					data-testid="illustration-number"
				>
					{si.number}
				</div>
				<div class="text-xs text-slate-500">{formatDate(si.created_at)}</div>
			</div>
		</header>

		<section class="grid grid-cols-2 gap-4 text-sm">
			<div>
				<div class="text-slate-500">Insured</div>
				<div class="font-semibold text-slate-900" data-testid="illustration-insured">
					{si.insured_name}
				</div>
			</div>
			<div>
				<div class="text-slate-500">Age</div>
				<div class="font-semibold text-slate-900">{si.insured_age}</div>
			</div>
			<div>
				<div class="text-slate-500">Base plan</div>
				<div class="font-semibold text-slate-900">{si.product_name}</div>
			</div>
			<div>
				<div class="text-slate-500">Term · frequency</div>
				<div class="font-semibold text-slate-900">
					{si.term >= 99 ? 'Whole life' : `${si.term} years`} · {MODAL_LABELS[si.modal]}
				</div>
			</div>
		</section>

		<section>
			<h2 class="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">Benefits</h2>
			<table class="w-full text-left text-sm" data-testid="illustration-benefits">
				<thead class="border-b border-slate-200 text-xs text-slate-500">
					<tr>
						<th class="py-2">Coverage</th>
						<th class="py-2">Type</th>
						<th class="py-2 text-right">Sum insured</th>
						<th class="py-2 text-right">Annual premium</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each si.benefits as b (b.label)}
						<tr>
							<td class="py-2 font-medium text-slate-900">{b.label}</td>
							<td class="py-2 text-slate-500">{b.detail}</td>
							<td class="py-2 text-right text-slate-700"
								>{b.sum_assured != null ? formatBaht(b.sum_assured) : '—'}</td
							>
							<td class="py-2 text-right text-slate-700"
								>{b.premium != null ? formatBaht(b.premium) : '—'}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section class="rounded-lg bg-slate-50 p-4">
			<dl class="space-y-1 text-sm">
				<div class="flex justify-between">
					<dt class="text-slate-500">Total annual premium</dt>
					<dd class="font-bold text-slate-900" data-testid="illustration-total">
						{formatBaht(si.calc.total_annual_premium)}
					</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-slate-500">{MODAL_LABELS[si.modal]} payment</dt>
					<dd class="font-medium text-slate-900">{formatBaht(si.calc.modal_premium)}</dd>
				</div>
			</dl>
		</section>

		<p class="text-xs text-slate-400">
			This illustration is for demonstration purposes only and does not constitute a contract of
			insurance. Premiums are indicative and based on the information provided.
		</p>
	</article>
</div>
