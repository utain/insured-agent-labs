<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { formatBaht, formatDate, statusColors, initials } from '$lib/format';

	let { data } = $props();
	const lead = $derived(data.lead);
	const st = $derived(statusColors(lead.status));

	function ageOf(dob: string): number {
		const d = new Date(dob);
		return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
	}

	const rows = $derived([
		['Age', String(ageOf(lead.dob)), true],
		['Date of birth', lead.dob, true],
		['Gender', lead.gender, false],
		['Occupation', lead.occupation ?? '—', false],
		['National ID', lead.national_id ?? '—', true],
		['Phone', lead.phone ?? '—', true],
		['Email', lead.email ?? '—', false]
	] as [string, string, boolean][]);
</script>

<svelte:head><title>{lead.full_name} · Vesta AgentSured</title></svelte:head>

<div class="page" data-testid="lead-detail-page">
	<a href="/leads" class="back">
		<Icon name="chevron-left" size={15} stroke={2} />All leads
	</a>

	<div class="split">
		<div class="v-card profile">
			<div class="profile-head">
				<span
					class="v-avatar"
					style="width:52px;height:52px;font-size:var(--text-lg);color:var(--text-primary);"
					>{initials(lead.full_name)}</span
				>
				<div style="min-width:0;">
					<h1 class="name" data-testid="lead-detail-page-title">{lead.full_name}</h1>
					<span
						class="v-badge"
						data-testid="lead-detail-status"
						style="color:{st.fg};background:{st.bg};">{lead.status}</span
					>
				</div>
			</div>

			<div class="fields">
				{#each rows as [label, value, num] (label)}
					<div class="field">
						<span class="f-label">{label}</span>
						<span class="f-value" class:cap={!num} data-num={num ? '' : undefined}>{value}</span>
					</div>
				{/each}
			</div>

			<a
				href="/quotations/new?leadId={lead.id}"
				class="v-btn v-btn-primary start"
				data-testid="lead-start-quotation-button"
			>
				<Icon name="zap" size={16} stroke={2.2} />Start quotation
			</a>
		</div>

		<div class="v-card quotes">
			<div class="quotes-head"><h2>Quotations</h2></div>
			{#if data.quotations.length === 0}
				<div class="no-quotes">
					<p>No quotations yet for this lead.</p>
					<a href="/quotations/new?leadId={lead.id}" class="v-btn v-btn-secondary">Start one now</a>
				</div>
			{:else}
				{#each data.quotations as q (q.id)}
					{@const qs = statusColors(q.status)}
					<a
						href={q.status === 'illustrated' && q.illustration_id
							? `/illustrations/${q.illustration_id}`
							: `/quotations/${q.id}`}
						class="quote-row"
					>
						<div style="flex:1;min-width:0;">
							<div class="q-product">{q.base_product_code ?? 'Draft'}</div>
							<div class="q-meta">
								{formatDate(q.created_at)} · {q.calc
									? `${formatBaht(q.calc.total_annual_premium)}/yr`
									: 'No premium yet'}
							</div>
						</div>
						<span class="v-badge" style="color:{qs.fg};background:{qs.bg};">{q.status}</span>
						<Icon name="chevron-right" size={16} stroke={2} class="q-chevron" />
					</a>
				{/each}
			{/if}
		</div>
	</div>
</div>

<style>
	.page {
		max-width: 980px;
		margin: 0 auto;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--text-tertiary);
		font-size: var(--text-sm);
		font-weight: 500;
		text-decoration: none;
		margin-bottom: 16px;
	}
	.back:hover {
		color: var(--text-secondary);
	}
	.split {
		display: grid;
		grid-template-columns: 1fr 1.3fr;
		gap: 18px;
		align-items: start;
	}

	.profile {
		padding: 24px;
	}
	.profile-head {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 20px;
	}
	.name {
		font-size: var(--text-xl);
		font-weight: 700;
		letter-spacing: -0.01em;
		margin: 0 0 6px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.fields {
		display: flex;
		flex-direction: column;
	}
	.field {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 0;
		border-top: 1px solid var(--border-subtle);
		font-size: var(--text-sm);
	}
	.f-label {
		color: var(--text-tertiary);
		flex: none;
	}
	.f-value {
		color: var(--text-primary);
		font-weight: 500;
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.f-value.cap {
		text-transform: capitalize;
	}
	.start {
		margin-top: 20px;
		width: 100%;
	}

	.quotes {
		overflow: hidden;
	}
	.quotes-head {
		padding: 16px 20px;
		border-bottom: 1px solid var(--border-subtle);
	}
	.quotes-head h2 {
		font-size: var(--text-md);
		font-weight: 600;
		margin: 0;
	}
	.no-quotes {
		padding: 40px 20px;
		text-align: center;
	}
	.no-quotes p {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 0 0 14px;
	}
	.quote-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 20px;
		border-top: 1px solid var(--border-subtle);
		text-decoration: none;
		color: inherit;
		transition: var(--transition-colors);
	}
	.quote-row:hover {
		background: var(--surface-overlay);
	}
	.q-product {
		font-weight: 600;
		color: var(--text-primary);
	}
	.q-meta {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-top: 2px;
	}
	:global(.q-chevron) {
		color: var(--text-tertiary);
	}

	@media (max-width: 1024px) {
		.split {
			grid-template-columns: 1fr;
		}
	}
</style>
