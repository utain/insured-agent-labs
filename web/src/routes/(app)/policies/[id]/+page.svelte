<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	let { data } = $props();
	const { eapp, quotation, product } = data;
	const formatBaht = (n: number) => '฿' + n.toLocaleString();
	const name = (en: string, th: string) => (getLocale() === 'th' ? th : en);
</script>

<svelte:head><title>{m['policy.title']()} · {m['app.title']()}</title></svelte:head>

<div class="max-w-2xl mx-auto" data-testid="policy-page">
	<h1 data-testid="policy-page-title" class="text-2xl font-bold text-slate-900 mb-6">
		{m['policy.title']()}
	</h1>

	<div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
		<div class="bg-green-50 border-b border-green-200 px-5 py-4">
			<p class="text-xs text-green-700 uppercase tracking-wide">{m['policy.status']()}</p>
			<p class="text-lg font-semibold text-green-900" data-testid="policy-status-badge">
				{eapp.status}
			</p>
		</div>

		<dl class="divide-y divide-slate-100">
			<div class="px-5 py-3 flex justify-between gap-4">
				<dt class="text-sm text-slate-500">{m['policy.number']()}</dt>
				<dd class="text-sm font-bold text-slate-900" data-testid="policy-number-value">
					{eapp.policy_number ?? '—'}
				</dd>
			</div>
			<div class="px-5 py-3 flex justify-between gap-4">
				<dt class="text-sm text-slate-500">{m['policy.insured']()}</dt>
				<dd class="text-sm font-medium text-slate-900" data-testid="policy-insured-name">
					{quotation.insured_name}
				</dd>
			</div>
			<div class="px-5 py-3 flex justify-between gap-4">
				<dt class="text-sm text-slate-500">{m['policy.product']()}</dt>
				<dd class="text-sm font-medium text-slate-900" data-testid="policy-product-name">
					{name(product.name_en, product.name_th)}
				</dd>
			</div>
			<div class="px-5 py-3 flex justify-between gap-4">
				<dt class="text-sm text-slate-500">{m['policy.sum_assured']()}</dt>
				<dd class="text-sm font-medium text-slate-900" data-testid="policy-sum-assured-value">
					{formatBaht(quotation.sum_assured)}
				</dd>
			</div>
			<div class="px-5 py-3 flex justify-between gap-4">
				<dt class="text-sm text-slate-500">{m['policy.premium']()}</dt>
				<dd class="text-sm font-medium text-slate-900" data-testid="policy-premium-value">
					{formatBaht(quotation.calc?.total_annual_premium ?? 0)}
				</dd>
			</div>
		</dl>
	</div>

	<a
		href="/"
		data-testid="policy-back-to-dashboard-button"
		class="mt-6 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
	>
		← {m['policy.back']()}
	</a>
</div>
