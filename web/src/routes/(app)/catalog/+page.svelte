<script lang="ts">
	import { formatBaht } from '$lib/format';
	import { RIDER_TYPES, RIDER_TYPE_LABELS } from '$lib/schemas';

	let { data } = $props();
	let tab = $state<'products' | string>('products');

	const tabs = [
		{ key: 'products', label: 'Life plans' },
		...RIDER_TYPES.map((t) => ({ key: t, label: RIDER_TYPE_LABELS[t] }))
	];
</script>

<svelte:head><title>Catalog · Vesta AgentSured</title></svelte:head>

<div class="page" data-testid="catalog-page">
	<h1 class="v-h1">Catalog</h1>
	<p class="v-sub" style="margin:4px 0 18px;">Reference for all products and riders.</p>

	<div class="tabs">
		{#each tabs as t (t.key)}
			<button class="tab" class:active={tab === t.key} onclick={() => (tab = t.key)}
				>{t.label}</button
			>
		{/each}
	</div>

	{#if tab === 'products'}
		<div class="grid">
			{#each data.products as p (p.code)}
				<div class="v-card card" data-testid="catalog-product">
					<div class="name">{p.name}</div>
					<p class="desc">{p.description}</p>
					<div class="rows">
						<div class="row">
							<span>Age range</span><span data-num>{p.min_age}–{p.max_age}</span>
						</div>
						<div class="row">
							<span>Sum insured</span>
							<span data-num>{formatBaht(p.min_sum_assured)} – {formatBaht(p.max_sum_assured)}</span
							>
						</div>
						<div class="row">
							<span>Terms</span>
							<span data-num>{p.term_options.map((t) => (t >= 99 ? 'WL' : t)).join(', ')}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid">
			{#each data.riders.filter((r) => r.rider_type === tab) as r (r.code)}
				<div class="v-card card" data-testid="catalog-rider">
					<div class="name">{r.name}</div>
					<p class="desc">{r.description}</p>
					<div class="rows">
						<div class="row">
							<span>Age range</span><span data-num>{r.min_age}–{r.max_age}</span>
						</div>
						<div class="row">
							<span>Pricing</span>
							<span>
								{r.flat_premium != null ? `${formatBaht(r.flat_premium)}/yr flat` : 'Rate-based'}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1080px;
		margin: 0 auto;
	}
	.tabs {
		display: flex;
		gap: 22px;
		border-bottom: 1px solid var(--border-subtle);
		margin-bottom: 20px;
		overflow-x: auto;
	}
	.tab {
		padding: 10px 0;
		border: none;
		background: none;
		cursor: pointer;
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		white-space: nowrap;
		color: var(--text-tertiary);
		box-shadow: inset 0 -2px 0 transparent;
		transition: var(--transition-colors);
	}
	.tab:hover {
		color: var(--text-secondary);
	}
	.tab.active {
		color: var(--text-primary);
		box-shadow: inset 0 -2px 0 var(--brand);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}
	.card {
		padding: 20px;
	}
	.name {
		font-size: var(--text-md);
		font-weight: 600;
		margin-bottom: 4px;
	}
	.desc {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		margin: 0 0 14px;
		line-height: 1.5;
	}
	.rows {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: var(--text-sm);
	}
	.row {
		display: flex;
		justify-content: space-between;
	}
	.row span:first-child {
		color: var(--text-tertiary);
	}

	@media (max-width: 760px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
