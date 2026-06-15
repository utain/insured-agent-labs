<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { formatBaht, formatDate } from '$lib/format';
	import { MODAL_LABELS } from '$lib/schemas';

	let { data } = $props();
	const si = $derived(data.illustration);
</script>

<svelte:head><title>{si.number} · Sales Illustration</title></svelte:head>

<div class="page" data-testid="illustration-page">
	<div class="toolbar no-print">
		<a
			href="/quotations/{si.quotation_id}"
			class="v-btn v-btn-secondary v-btn-sm"
			data-testid="illustration-edit"
		>
			<Icon name="chevron-left" size={14} stroke={2} />Back to edit
		</a>
		<div class="toolbar-right">
			<a href="/" class="v-btn v-btn-secondary v-btn-sm" data-testid="illustration-exit"
				>Dashboard</a
			>
			<button type="button" class="v-btn v-btn-primary v-btn-sm" onclick={() => window.print()}>
				<Icon name="printer" size={15} stroke={2} />Print
			</button>
		</div>
	</div>

	<!-- Paper -->
	<article class="paper">
		<header class="paper-head">
			<div class="brand">
				<img src="/vesta-mark.svg" width="36" height="36" alt="" />
				<div>
					<div class="brand-name">Vesta AgentSured</div>
					<div class="brand-eyebrow">Sales illustration</div>
				</div>
			</div>
			<div class="paper-num">
				<div class="num" data-testid="illustration-number">{si.number}</div>
				<div class="date">{formatDate(si.created_at)}</div>
			</div>
		</header>

		<section class="insured-grid" data-testid="illustration-insured">
			<div>
				<div class="cell-label">Insured</div>
				<div class="cell-value">{si.insured_name}</div>
			</div>
			<div>
				<div class="cell-label">Age</div>
				<div class="cell-value">{si.insured_age}</div>
			</div>
			<div>
				<div class="cell-label">Base plan</div>
				<div class="cell-value">{si.product_name}</div>
			</div>
			<div>
				<div class="cell-label">Term &amp; frequency</div>
				<div class="cell-value">
					{si.term >= 99 ? 'Whole life' : `${si.term} years`} · {MODAL_LABELS[si.modal]}
				</div>
			</div>
		</section>

		<section class="benefits">
			<div class="cell-label" style="margin-bottom:12px;">Benefits</div>
			<div data-testid="illustration-benefits">
				<div class="b-head">
					<span class="b-cov">Coverage</span>
					<span class="b-type">Type</span>
					<span class="b-sum">Sum insured</span>
					<span class="b-prem">Annual premium</span>
				</div>
				{#each si.benefits as b (b.label)}
					<div class="b-row">
						<span class="b-cov b-strong">{b.label}</span>
						<span class="b-type b-muted">{b.detail}</span>
						<span class="b-sum">{b.sum_assured != null ? formatBaht(b.sum_assured) : '—'}</span>
						<span class="b-prem b-strong">{b.premium != null ? formatBaht(b.premium) : '—'}</span>
					</div>
				{/each}
			</div>
		</section>

		<section class="totals">
			<div class="total-bar" data-testid="illustration-total">
				<span>Total annual premium</span>
				<span class="total-val">{formatBaht(si.calc.total_annual_premium)}</span>
			</div>
			<div class="modal-bar">
				<span>{MODAL_LABELS[si.modal]} installment</span>
				<span class="modal-val">{formatBaht(si.calc.modal_premium)}</span>
			</div>
		</section>

		<p class="disclaimer">
			This illustration is for information only and does not constitute a contract. Premiums and
			benefits are subject to underwriting and policy terms. Figures shown in Thai Baht (฿).
		</p>
	</article>
</div>

<style>
	.page {
		max-width: 760px;
		margin: 0 auto;
	}
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 18px;
	}
	.toolbar-right {
		display: flex;
		gap: 10px;
	}

	/* The paper is a printed document: fixed light palette in any theme. */
	.paper {
		background: #ffffff;
		color: #0e1a2b;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: 40px 44px;
		font-feature-settings: 'tnum' 1;
	}
	.paper-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		padding-bottom: 20px;
		border-bottom: 2px solid #0e1a2b;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 11px;
	}
	.brand-name {
		font-size: 17px;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.brand-eyebrow {
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #69788e;
		margin-top: 3px;
	}
	.paper-num {
		text-align: right;
	}
	.num {
		font-size: 15px;
		font-weight: 700;
	}
	.date {
		font-size: 12px;
		color: #69788e;
		margin-top: 3px;
	}

	.insured-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px 24px;
		padding: 22px 0;
		border-bottom: 1px solid #dce3ee;
	}
	.cell-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #69788e;
		margin-bottom: 4px;
	}
	.cell-value {
		font-size: 15px;
		font-weight: 600;
	}

	.benefits {
		padding: 20px 0;
	}
	.b-head,
	.b-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.b-head {
		padding: 0 0 8px;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #8e9db4;
		border-bottom: 1px solid #dce3ee;
	}
	.b-row {
		padding: 11px 0;
		border-bottom: 1px solid #eef2f8;
		font-size: 14px;
	}
	.b-cov {
		flex: 1;
	}
	.b-type {
		width: 90px;
		flex: none;
	}
	.b-sum {
		width: 120px;
		flex: none;
		text-align: right;
	}
	.b-prem {
		width: 110px;
		flex: none;
		text-align: right;
	}
	.b-strong {
		font-weight: 600;
	}
	.b-muted {
		color: #69788e;
	}

	.totals {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px 0 0;
	}
	.total-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		border-radius: 10px;
		background: #070d17;
		color: #eaf1f9;
	}
	.total-bar span:first-child {
		font-size: 14px;
		color: #a9b8cc;
	}
	.total-val {
		font-size: 24px;
		font-weight: 700;
	}
	.modal-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 11px 18px;
		border-radius: 10px;
		background: #e6fafe;
		color: #0c7386;
	}
	.modal-bar span:first-child {
		font-size: 14px;
		font-weight: 500;
	}
	.modal-val {
		font-size: 17px;
		font-weight: 700;
	}
	.disclaimer {
		font-size: 11px;
		line-height: 1.6;
		color: #8e9db4;
		margin: 22px 0 0;
	}

	@media print {
		.paper {
			box-shadow: none;
			border-radius: 0;
			padding: 0;
		}
	}
	@media (max-width: 560px) {
		.paper {
			padding: 28px 22px;
		}
		.b-type {
			display: none;
		}
	}
</style>
