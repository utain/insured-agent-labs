<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { RiderType } from '$lib/types';

	let { data } = $props();

	type Tab = 'all' | RiderType;
	let activeTab = $state<Tab>('all');

	const tabs: Tab[] = ['all', 'health', 'ci', 'pa', 'tpd', 'wp'];

	const filteredRiders = $derived(
		activeTab === 'all' ? data.riders : data.riders.filter((r) => r.rider_type === activeTab)
	);

	const name = (en: string, th: string) => (getLocale() === 'th' ? th : en);
	const formatBaht = (n: number) => '฿' + n.toLocaleString();
</script>

<svelte:head><title>{m['catalog.title']()} · {m['app.title']()}</title></svelte:head>

<div data-testid="catalog-page">
	<h1 data-testid="catalog-page-title" class="text-2xl font-bold text-slate-900 mb-6">
		{m['catalog.title']()}
	</h1>

	<!-- Base products -->
	<section class="mb-10">
		<h2 class="text-lg font-semibold text-slate-800 mb-4" data-testid="catalog-products-heading">
			{m['catalog.products']()}
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{#each data.products as product (product.code)}
				<div
					data-testid="catalog-product-card-{product.code}"
					class="bg-white rounded-lg border border-slate-200 p-5"
				>
					<h3
						class="text-base font-semibold text-slate-900"
						data-testid="catalog-product-name-{product.code}"
					>
						{name(product.name_en, product.name_th)}
					</h3>
					<p class="mt-1 text-sm text-slate-600">
						{name(product.description_en, product.description_th)}
					</p>
					<dl class="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
						<div>
							<dt>{m['catalog.min_age']()}</dt>
							<dd class="font-medium text-slate-700">{product.min_age}</dd>
						</div>
						<div>
							<dt>{m['catalog.max_age']()}</dt>
							<dd class="font-medium text-slate-700">{product.max_age}</dd>
						</div>
						<div class="col-span-2">
							<dt>{m['catalog.sum_assured_range']()}</dt>
							<dd class="font-medium text-slate-700">
								{formatBaht(product.min_sum_assured)} – {formatBaht(product.max_sum_assured)}
							</dd>
						</div>
					</dl>
				</div>
			{/each}
		</div>
	</section>

	<!-- Riders -->
	<section>
		<h2 class="text-lg font-semibold text-slate-800 mb-4" data-testid="catalog-riders-heading">
			{m['catalog.riders']()}
		</h2>

		<div class="flex flex-wrap gap-2 mb-4" role="tablist" data-testid="catalog-rider-type-filter">
			{#each tabs as tab (tab)}
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === tab}
					data-testid="catalog-rider-type-tab-{tab}"
					onclick={() => (activeTab = tab)}
					class="px-3 py-1.5 text-sm rounded-md border transition-colors {activeTab === tab
						? 'bg-slate-900 text-white border-slate-900'
						: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}"
				>
					{m[`catalog.rider_type.${tab}`]()}
				</button>
			{/each}
		</div>

		<div
			class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
			data-testid="catalog-rider-grid"
		>
			{#each filteredRiders as rider (rider.code)}
				<div
					data-testid="catalog-rider-card-{rider.code}"
					class="bg-white rounded-lg border border-slate-200 p-4"
				>
					<h3
						class="text-sm font-semibold text-slate-900"
						data-testid="catalog-rider-plan-name-{rider.code}"
					>
						{name(rider.name_en, rider.name_th)}
					</h3>
					<p class="mt-1 text-xs text-slate-500 uppercase tracking-wide">
						{m[`catalog.rider_type.${rider.rider_type}`]()}
					</p>
					<p class="mt-2 text-xs text-slate-600">
						{m['catalog.sum_assured_range']()}:
						{rider.sum_assured_options.map((o) => formatBaht(o)).join(', ')}
					</p>
				</div>
			{/each}
		</div>
	</section>
</div>
