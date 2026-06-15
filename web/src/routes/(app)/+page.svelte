<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { formatDate, statusColors, KIND_TONES } from '$lib/format';
	import type { TransactionKind } from '$lib/schemas';

	let { data } = $props();
	const user = $derived(data.user);

	let variant = $state<'pulse' | 'compact'>('pulse');

	const kindHref = (kind: string, refId: string) => {
		switch (kind) {
			case 'lead':
				return `/leads/${refId}`;
			case 'quotation':
				return `/quotations/${refId}`;
			case 'illustration':
				return `/illustrations/${refId}`;
			default:
				return '#';
		}
	};

	const stats = $derived([
		{ label: 'Active leads', value: data.stats.leads, href: '/leads', accent: false },
		{ label: 'Saved packages', value: data.stats.packages, href: '/packages', accent: false },
		{ label: 'Quotations', value: data.stats.quotations, href: '/quotations/new', accent: false },
		{ label: 'Illustrations issued', value: data.stats.illustrated, href: '/', accent: true }
	]);

	const funnel = $derived([
		{ label: 'New', count: data.funnel.new, color: 'var(--navy-400)' },
		{ label: 'Contacted', count: data.funnel.contacted, color: 'var(--cyan-300)' },
		{ label: 'Quoted', count: data.funnel.quoted, color: 'var(--brand)' },
		{ label: 'Customer', count: data.funnel.customer, color: 'var(--accent)' }
	]);
	const funnelTotal = $derived(
		Math.max(
			1,
			funnel.reduce((a, f) => a + f.count, 0)
		)
	);
</script>

<svelte:head><title>Dashboard · Vesta AgentSured</title></svelte:head>

{#snippet row(item: (typeof data.recent)[number])}
	{@const kind = KIND_TONES[item.kind as TransactionKind]}
	{@const st = statusColors(item.status)}
	<div class="row" data-testid="dashboard-row" data-kind={item.kind} data-status={item.status}>
		<span class="v-badge cell-kind" style="color:{kind.fg};background:{kind.bg};">{item.kind}</span>
		<div class="cell-item">
			<div class="item-title">{item.title}</div>
			<div class="item-summary">{item.summary}</div>
		</div>
		<span class="v-badge cell-status" style="color:{st.fg};background:{st.bg};">{item.status}</span>
		<span class="cell-date" data-num>{formatDate(item.updated_at)}</span>
		<a
			href={kindHref(item.kind, item.reference_id)}
			class="v-btn v-btn-secondary v-btn-sm"
			data-testid="dashboard-row-action">Open</a
		>
	</div>
{/snippet}

<div class="page" data-testid="dashboard-page">
	<header class="page-head">
		<div>
			<h1 class="v-h1" data-testid="dashboard-page-title">Welcome back, {user?.display_name}</h1>
			<p class="v-sub" style="margin-top:4px;">Here's what's moving in your pipeline today.</p>
		</div>
		<div class="head-actions">
			<div class="v-seg">
				<button class:is-active={variant === 'pulse'} onclick={() => (variant = 'pulse')}
					>Pulse</button
				>
				<button class:is-active={variant === 'compact'} onclick={() => (variant = 'compact')}
					>Compact</button
				>
			</div>
			<a href="/quotations/new" class="v-btn v-btn-primary" data-testid="dashboard-new-quotation">
				<Icon name="zap" size={16} stroke={2.2} />
				Start a quotation
			</a>
		</div>
	</header>

	<div class="stats">
		{#each stats as s (s.label)}
			<a class="metric" class:accent={s.accent} href={s.href}>
				<span class="v-eyebrow">{s.label}</span>
				<span class="metric-value" data-num>{s.value}</span>
			</a>
		{/each}
	</div>

	{#if data.recent.length === 0}
		<div class="empty v-card" data-testid="dashboard-empty">
			<h3>Nothing here yet</h3>
			<p>Create a lead or start a quotation to see activity here.</p>
			<a href="/quotations/new" class="v-btn v-btn-primary">Start a quotation</a>
		</div>
	{:else if variant === 'pulse'}
		<div class="pulse">
			<div class="v-card activity">
				<div class="card-head">
					<h2>Recent activity</h2>
					<a href="/leads" class="link">View leads</a>
				</div>
				<div data-testid="dashboard-table">
					{#each data.recent as item (item.id)}
						{@render row(item)}
					{/each}
				</div>
			</div>

			<div class="side">
				<div class="v-card pipeline">
					<h2>Pipeline</h2>
					<p class="pipeline-sub">Leads by stage</p>
					<div class="bars">
						{#each funnel as f (f.label)}
							<div>
								<div class="bar-head">
									<span class="bar-label"
										><span class="swatch" style="background:{f.color}"></span>{f.label}</span
									>
									<span class="bar-count" data-num>{f.count}</span>
								</div>
								<div class="bar-track">
									<div
										class="bar-fill"
										style="width:{(f.count / funnelTotal) * 100}%;background:{f.color}"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="v-card quickstart">
					<div class="qs-pill">
						<Icon name="zap" size={13} stroke={2.2} />Quick start
					</div>
					<p>Spin up a quotation from a saved package, or add a fresh lead to your pipeline.</p>
					<div class="qs-actions">
						<a href="/quotations/new" class="v-btn v-btn-primary">Start a quotation</a>
						<a href="/leads/new" class="v-btn v-btn-secondary">+ New lead</a>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="v-card activity">
			<div class="card-head">
				<h2>All activity</h2>
				<a href="/leads/new" class="link">+ New lead</a>
			</div>
			<div data-testid="dashboard-table">
				{#each data.recent as item (item.id)}
					{@render row(item)}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1240px;
		margin: 0 auto;
	}
	.page-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 22px;
	}
	.head-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		margin-bottom: 18px;
	}
	.metric {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 18px 20px;
		min-height: 108px;
		justify-content: space-between;
		background: var(--surface-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--ring-inset), var(--shadow-sm);
		text-decoration: none;
		color: inherit;
		transition:
			transform var(--dur-base) var(--ease-out),
			box-shadow var(--dur-base) var(--ease-standard);
	}
	.metric:hover {
		box-shadow: var(--ring-inset), var(--shadow-md);
		transform: translateY(-2px);
	}
	.metric.accent {
		background: linear-gradient(150deg, var(--brand-subtle), transparent 70%), var(--surface-card);
	}
	.metric-value {
		font-size: var(--text-3xl);
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text-primary);
	}
	.metric.accent .metric-value {
		color: var(--brand);
	}

	.empty {
		text-align: center;
		padding: 56px 24px;
	}
	.empty h3 {
		font-size: var(--text-lg);
		font-weight: 600;
		margin: 0 0 8px;
	}
	.empty p {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 0 0 18px;
	}

	.pulse {
		display: grid;
		grid-template-columns: 1.7fr 1fr;
		gap: 18px;
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.activity {
		overflow: hidden;
	}
	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid var(--border-subtle);
	}
	.card-head h2 {
		font-size: var(--text-md);
		font-weight: 600;
		margin: 0;
	}
	.link {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--brand);
		background: none;
		border: none;
		cursor: pointer;
		text-decoration: none;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 13px 20px;
		border-top: 1px solid var(--border-subtle);
	}
	.row:first-child {
		border-top: none;
	}
	.cell-kind {
		width: 84px;
		flex: none;
	}
	.cell-item {
		flex: 1;
		min-width: 0;
	}
	.item-title {
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.item-summary {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-top: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.cell-status {
		width: 84px;
		flex: none;
	}
	.cell-date {
		width: 104px;
		flex: none;
		color: var(--text-tertiary);
		font-size: var(--text-xs);
		white-space: nowrap;
	}

	.pipeline {
		padding: 20px;
	}
	.pipeline h2 {
		font-size: var(--text-md);
		font-weight: 600;
		margin: 0 0 4px;
	}
	.pipeline-sub {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin: 0 0 16px;
	}
	.bars {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.bar-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}
	.bar-label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.swatch {
		width: 8px;
		height: 8px;
		border-radius: 2px;
	}
	.bar-count {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
	}
	.bar-track {
		height: 8px;
		border-radius: 999px;
		background: var(--surface-inset);
		overflow: hidden;
		box-shadow: var(--ring-inset);
	}
	.bar-fill {
		height: 100%;
		border-radius: 999px;
	}

	.quickstart {
		padding: 20px;
		background: linear-gradient(150deg, var(--accent-subtle), transparent 70%), var(--surface-card);
	}
	.qs-pill {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 3px 10px;
		border-radius: 999px;
		background: var(--accent-subtle);
		color: var(--accent);
		font-size: var(--text-2xs);
		font-weight: 600;
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
		margin-bottom: 12px;
	}
	.quickstart p {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 0 0 16px;
		line-height: 1.5;
	}
	.qs-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.qs-actions .v-btn {
		width: 100%;
	}

	@media (max-width: 1024px) {
		.stats {
			grid-template-columns: repeat(2, 1fr);
		}
		.pulse {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.stats {
			grid-template-columns: 1fr;
		}
		.cell-date {
			display: none;
		}
	}
</style>
