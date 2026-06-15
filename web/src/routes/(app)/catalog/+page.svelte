<script lang="ts">
	import { formatBaht } from '$lib/format';
	import { RIDER_TYPES, RIDER_TYPE_LABELS } from '$lib/schemas';

	let { data } = $props();
	let tab = $state<'products' | string>('products');
</script>

<svelte:head><title>Catalog · InsureAgentLabs</title></svelte:head>

<div data-testid="catalog-page" class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-slate-900">Product catalog</h1>
		<p class="mt-1 text-sm text-slate-600">Life base plans and supplementary riders.</p>
	</div>

	<div class="flex flex-wrap gap-2">
		<button
			class={tab === 'products' ? 'btn-primary' : 'btn-secondary'}
			onclick={() => (tab = 'products')}
		>
			Life plans
		</button>
		{#each RIDER_TYPES as t (t)}
			<button class={tab === t ? 'btn-primary' : 'btn-secondary'} onclick={() => (tab = t)}>
				{RIDER_TYPE_LABELS[t]}
			</button>
		{/each}
	</div>

	{#if tab === 'products'}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.products as p (p.code)}
				<div class="card p-5" data-testid="catalog-product">
					<h2 class="font-semibold text-slate-900">{p.name}</h2>
					<p class="mt-1 text-sm text-slate-500">{p.description}</p>
					<dl class="mt-3 space-y-1 text-xs text-slate-500">
						<div class="flex justify-between">
							<dt>Ages</dt>
							<dd>{p.min_age}–{p.max_age}</dd>
						</div>
						<div class="flex justify-between">
							<dt>Sum insured</dt>
							<dd>{formatBaht(p.min_sum_assured)} – {formatBaht(p.max_sum_assured)}</dd>
						</div>
						<div class="flex justify-between">
							<dt>Terms</dt>
							<dd>{p.term_options.map((t) => (t >= 99 ? 'WL' : t)).join(', ')}</dd>
						</div>
					</dl>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.riders.filter((r) => r.rider_type === tab) as r (r.code)}
				<div class="card p-5" data-testid="catalog-rider">
					<h2 class="font-semibold text-slate-900">{r.name}</h2>
					<p class="mt-1 text-sm text-slate-500">{r.description}</p>
					<dl class="mt-3 space-y-1 text-xs text-slate-500">
						<div class="flex justify-between">
							<dt>Ages</dt>
							<dd>{r.min_age}–{r.max_age}</dd>
						</div>
						{#if r.flat_premium != null}
							<div class="flex justify-between">
								<dt>Premium</dt>
								<dd>{formatBaht(r.flat_premium)}/yr (flat)</dd>
							</div>
						{:else}
							<div class="flex justify-between">
								<dt>Sum insured</dt>
								<dd>{formatBaht(r.sum_assured_options[0])}+</dd>
							</div>
						{/if}
					</dl>
				</div>
			{/each}
		</div>
	{/if}
</div>
