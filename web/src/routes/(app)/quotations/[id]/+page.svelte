<script lang="ts">
	import { goto } from '$app/navigation';
	import { SvelteSet } from 'svelte/reactivity';
	import Icon from '$lib/components/Icon.svelte';
	import { formatBaht, initials } from '$lib/format';
	import {
		MODAL_FACTORS,
		MODAL_LABELS,
		MODALS,
		RIDER_TYPES,
		RIDER_TYPE_LABELS,
		type Modal,
		type RiderType,
		type Quotation
	} from '$lib/schemas';

	// Per-installment cadence shown on each payment-frequency card.
	const MODAL_CADENCE: Record<Modal, { unit: string; perYear: string }> = {
		annual: { unit: '/year', perYear: '×1 / yr' },
		semi: { unit: '/6 months', perYear: '×2 / yr' },
		quarterly: { unit: '/quarter', perYear: 'every 3 months' },
		monthly: { unit: '/month', perYear: '×12 / yr' }
	};

	let { data } = $props();

	const id = data.quotation.id;
	const user = $derived(data.user);
	const isBug = $derived(user?.scenario_flag === 'bug');

	type Sel = { code: string; sum: number };

	function ridersFrom(q: Quotation): Partial<Record<RiderType, Sel>> {
		const out: Partial<Record<RiderType, Sel>> = {};
		for (const sel of q.riders) {
			const plan = data.riders.find((r) => r.code === sel.code);
			if (plan) out[plan.rider_type] = { code: sel.code, sum: sel.sum_assured };
		}
		return out;
	}

	let quotation = $state(data.quotation);
	let calc = $state(data.quotation.calc);
	let step = $state<'plan' | 'coverage'>(data.quotation.base_product_code ? 'coverage' : 'plan');
	let wizMode = $state<'guided' | 'compact'>('guided');

	let sumAssured = $state(data.quotation.sum_assured || 0);
	let term = $state(data.quotation.term || 0);
	let modal = $state<Modal>(data.quotation.modal);
	let riderSel = $state<Partial<Record<RiderType, Sel>>>(ridersFrom(data.quotation));
	const openCats = new SvelteSet<RiderType>();

	let busy = $state(false);
	let calculating = $state(false);
	let errors = $state<Record<string, string>>({});
	let generalError = $state('');

	const product = $derived(
		data.products.find((p) => p.code === quotation.base_product_code) ?? null
	);
	const ridersByType = (t: RiderType) => data.riders.filter((r) => r.rider_type === t);

	// code -> calculated rider premium, for the accordion subtotals + summary.
	const riderPremiumByCode = $derived(
		Object.fromEntries((calc?.rider_premiums ?? []).map((rp) => [rp.code, rp.premium]))
	);

	const modalChoices = $derived(
		MODALS.map((m) => {
			const cadence = MODAL_CADENCE[m];
			const amount = calc ? calc.total_annual_premium * MODAL_FACTORS[m] : null;
			return {
				value: m,
				label: MODAL_LABELS[m],
				detail: amount != null ? `${formatBaht(amount)} ${cadence.unit}` : cadence.perYear
			};
		})
	);

	function selectedRiders() {
		return Object.values(riderSel)
			.filter((s): s is Sel => !!s && !!s.code)
			.map((s) => ({ code: s.code, sum_assured: s.sum }));
	}

	function handleErr(json: {
		error?: { message?: string; fields?: { field: string; message: string }[] };
	}) {
		errors = {};
		generalError = '';
		for (const f of json.error?.fields ?? []) errors[f.field] = f.message;
		if (!json.error?.fields?.length) generalError = json.error?.message ?? 'Something went wrong';
	}

	async function put(body: Record<string, unknown>): Promise<Quotation | null> {
		busy = true;
		try {
			const res = await fetch(`/api/quotations/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const json = await res.json();
			if (!res.ok) {
				handleErr(json);
				return null;
			}
			quotation = json;
			calc = json.calc;
			errors = {};
			generalError = '';
			return json;
		} finally {
			busy = false;
		}
	}

	function syncFrom(q: Quotation) {
		sumAssured = q.sum_assured;
		term = q.term;
		modal = q.modal;
		riderSel = ridersFrom(q);
	}

	async function selectProduct(code: string) {
		const j = await put({ base_product_code: code });
		if (j) {
			syncFrom(j);
			step = 'coverage';
			await recalc();
		}
	}

	async function applyPackage(pkgId: string) {
		const j = await put({ apply_package: pkgId });
		if (j) {
			syncFrom(j);
			step = 'coverage';
			await recalc();
		}
	}

	async function recalc() {
		const j = await put({
			base_product_code: quotation.base_product_code,
			sum_assured: sumAssured,
			term,
			modal,
			riders: selectedRiders()
		});
		if (!j) return;
		// The preview endpoint surfaces the glitch delay for agent.glitch.
		calculating = true;
		try {
			const res = await fetch(`/api/quotations/${id}/calculate`, { method: 'POST' });
			const json = await res.json();
			if (res.ok) calc = json;
			else handleErr(json);
		} finally {
			calculating = false;
		}
	}

	async function confirm() {
		generalError = '';
		const res = await fetch(`/api/quotations/${id}/illustrate`, { method: 'POST' });
		const json = await res.json();
		if (res.ok) await goto(`/illustrations/${json.id}`);
		else handleErr(json);
	}

	function pickRider(t: RiderType, code: string) {
		if (!code || riderSel[t]?.code === code) {
			delete riderSel[t];
			riderSel = { ...riderSel };
			return;
		}
		const plan = data.riders.find((r) => r.code === code)!;
		const sum = plan.flat_premium != null ? 0 : (plan.sum_assured_options[0] ?? 0);
		riderSel = { ...riderSel, [t]: { code, sum } };
	}

	function toggleCat(t: RiderType) {
		if (openCats.has(t)) openCats.delete(t);
		else openCats.add(t);
	}

	const termLabel = (t: number) => (t >= 99 ? 'Whole life' : `${t} yrs`);
</script>

<svelte:head><title>Build quotation · Vesta AgentSured</title></svelte:head>

<div class="page" data-testid="quotation-detail-page">
	<!-- Insured header + steps -->
	<div class="qhead">
		<div class="insured">
			<span
				class="v-avatar"
				style="width:42px;height:42px;font-size:var(--text-sm);color:var(--text-primary);"
				>{initials(quotation.insured_name)}</span
			>
			<div>
				<div class="insured-name">{quotation.insured_name}</div>
				<div class="insured-meta">
					Age {quotation.insured_age} · Step {step === 'plan' ? '2' : '3'} of 3
				</div>
			</div>
		</div>
		<div class="qsteps">
			<span class="qstep done"><span class="qdot done">✓</span>Insured</span>
			<span class="qstep-rule"></span>
			<span class="qstep" class:active={step === 'plan'}>
				<span class="qdot" class:active={step === 'plan'}>2</span>Plan
			</span>
			<span class="qstep-rule"></span>
			<span class="qstep" class:active={step === 'coverage'}>
				<span class="qdot" class:active={step === 'coverage'}>3</span>Coverage
			</span>
		</div>
	</div>

	{#if generalError}
		<div class="v-alert-error" data-testid="quotation-error" style="margin-bottom:18px;">
			<Icon name="alert-circle" size={18} stroke={2} />
			<span>{generalError}</span>
		</div>
	{/if}

	{#if step === 'plan'}
		{#if data.packages.length > 0}
			<section style="margin-bottom:26px;">
				<h2 class="sec-title">Apply a package</h2>
				<p class="sec-sub">Start from a ready-made bundle, then fine-tune.</p>
				<div class="grid3" data-testid="package-options">
					{#each data.packages as pkg (pkg.id)}
						<button
							type="button"
							class="pick-card"
							onclick={() => applyPackage(pkg.id)}
							disabled={busy}
							data-testid="package-option"
						>
							<div class="pick-top">
								<span class="pick-name">{pkg.name}</span>
								<span class="rider-pill">
									<Icon name="package" size={11} stroke={2.2} />{pkg.riders.length}
								</span>
							</div>
							<p class="pick-desc">{pkg.description}</p>
							<div class="pick-meta">
								<span>{pkg.base_product_code}</span><span class="dotsep">·</span><span data-num
									>{formatBaht(pkg.default_sum_assured)}</span
								>
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		<section>
			<h2 class="sec-title">Or pick a base life plan</h2>
			<p class="sec-sub">Build the quotation from scratch.</p>
			<div class="grid2" data-testid="product-options">
				{#each data.products as p (p.code)}
					<button
						type="button"
						class="pick-card row"
						onclick={() => selectProduct(p.code)}
						disabled={busy}
						data-testid="product-option"
						data-code={p.code}
					>
						<span class="plan-icon"><Icon name="heart" size={20} /></span>
						<div style="flex:1;min-width:0;">
							<div class="pick-name">{p.name}</div>
							<div class="pick-desc" style="margin:2px 0 0;">{p.description}</div>
							<div class="pick-sub">
								Ages {p.min_age}–{p.max_age} · {p.term_options
									.map((t) => (t >= 99 ? 'WL' : t))
									.join(', ')}
							</div>
						</div>
						<Icon name="chevron-right" size={18} stroke={2} class="muted" />
					</button>
				{/each}
			</div>
		</section>

		<div style="margin-top:22px;">
			<a href="/" class="v-btn v-btn-secondary">Exit</a>
		</div>
	{:else if product}
		<div class="cov-toolbar">
			<div class="cov-left">
				<button
					type="button"
					class="v-btn v-btn-secondary v-btn-sm"
					onclick={() => (step = 'plan')}
				>
					<Icon name="chevron-left" size={14} stroke={2} />Change plan
				</button>
				<span class="cov-base">Base: <strong>{product.name}</strong></span>
			</div>
			<div class="v-seg">
				<button class:is-active={wizMode === 'guided'} onclick={() => (wizMode = 'guided')}
					>Guided</button
				>
				<button class:is-active={wizMode === 'compact'} onclick={() => (wizMode = 'compact')}
					>Compact</button
				>
			</div>
		</div>

		<div class="cov-grid" class:compact={wizMode === 'compact'}>
			<div class="cov-forms">
				<!-- Coverage -->
				<div class="v-card pad">
					<h3 class="v-eyebrow" style="margin-bottom:14px;">Coverage</h3>

					<div class="field">
						<div class="field-row">
							<label class="v-label" style="margin:0;" for="sum">Sum insured</label>
							<span class="hint" data-num
								>{formatBaht(product.min_sum_assured)} – {formatBaht(product.max_sum_assured)}</span
							>
						</div>
						<div class="money">
							<span class="baht">฿</span>
							<input
								id="sum"
								type="number"
								bind:value={sumAssured}
								min={product.min_sum_assured}
								max={product.max_sum_assured}
								step="50000"
								data-testid="coverage-sum-assured"
								data-num
							/>
						</div>
						{#if errors.sum_assured}<span class="v-field-error">{errors.sum_assured}</span>{/if}
					</div>

					<div class="field">
						<span class="v-label">Term</span>
						<div class="chips" data-testid="coverage-term">
							{#each product.term_options as t (t)}
								<button
									type="button"
									class="chip"
									class:active={term === t}
									onclick={() => (term = t)}>{termLabel(t)}</button
								>
							{/each}
						</div>
						{#if errors.term}<span class="v-field-error">{errors.term}</span>{/if}
					</div>

					<div class="field" style="margin:0;">
						<span class="v-label">Payment frequency</span>
						<div class="modal-grid" data-testid="coverage-modal">
							{#each modalChoices as mo (mo.value)}
								<button
									type="button"
									class="modal-card"
									class:active={modal === mo.value}
									onclick={() => (modal = mo.value)}
									data-testid="coverage-modal-{mo.value}"
								>
									{mo.label}<span class="modal-detail" data-num>{mo.detail}</span>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Riders -->
				<div class="v-card riders-card">
					<h3 class="v-eyebrow" style="margin:6px 4px 12px;">Riders</h3>
					<div class="rider-list" data-testid="rider-list">
						{#each RIDER_TYPES as t (t)}
							{@const sel = riderSel[t]}
							{@const open = openCats.has(t)}
							{@const subtotal = sel ? riderPremiumByCode[sel.code] : undefined}
							<div class="rider-cat">
								<button
									type="button"
									class="cat-head"
									onclick={() => toggleCat(t)}
									data-testid="rider-cat-{t}"
								>
									<span
										class="cat-icon"
										style:background={sel ? 'var(--brand-subtle)' : 'var(--surface-inset)'}
										style:color={sel ? 'var(--brand)' : 'var(--text-tertiary)'}
									>
										<Icon name={t} size={18} />
									</span>
									<span class="cat-name">{RIDER_TYPE_LABELS[t]}</span>
									{#if sel}<span class="cat-count">1</span>{/if}
									<span class="cat-subtotal" data-num
										>{subtotal != null ? formatBaht(subtotal) : ''}</span
									>
									<Icon name="chevron-down" size={17} stroke={2} class={open ? 'rot' : ''} />
								</button>

								{#if open}
									{@const plan = sel ? data.riders.find((r) => r.code === sel.code) : null}
									<div class="cat-body">
										<div class="rider-cards" data-testid="rider-select-{t}">
											{#each ridersByType(t) as p (p.code)}
												{@const active = sel?.code === p.code}
												<button
													type="button"
													class="rider-card"
													class:active
													onclick={() => pickRider(t, p.code)}
												>
													<div class="rc-top">
														<span class="rc-name">{p.name}</span>
														<span class="rc-check" class:active>
															{#if active}<Icon name="check" size={10} stroke={3.4} />{/if}
														</span>
													</div>
													<span class="rc-benefit">{p.description}</span>
													<span class="rc-from" data-num>
														{p.flat_premium != null
															? `${formatBaht(p.flat_premium)}/yr`
															: 'rate-based'}
													</span>
												</button>
											{/each}
										</div>

										{#if sel && plan && plan.flat_premium == null}
											<div class="cover-row" data-testid="rider-sum-{t}">
												<span class="cover-label">Cover</span>
												<div class="cover-chips">
													{#each plan.sum_assured_options as opt (opt)}
														<button
															type="button"
															class="cover-chip"
															class:active={sel.sum === opt}
															onclick={() =>
																(riderSel = { ...riderSel, [t]: { code: sel.code, sum: opt } })}
															data-num>{formatBaht(opt)}</button
														>
													{/each}
												</div>
											</div>
										{:else if sel}
											<div class="cover-row" data-testid="rider-sum-{t}">
												<span class="cover-label">Flat premium rider</span>
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Premium summary -->
			<div class="cov-summary">
				<div class="v-card summary" data-testid="premium-summary">
					<div class="sum-head">
						<h3>Premium</h3>
						<span class="v-eyebrow">THB / year</span>
					</div>

					{#if calculating}
						<div class="sum-loading" data-testid="premium-loading">
							<Icon name="spinner" size={26} stroke={2.4} spin />
							<span>Calculating premium…</span>
						</div>
					{:else if calc}
						<div class="sum-lines">
							<div class="sum-line" data-testid="premium-base">
								<div>
									<div class="sl-name">{product.name}</div>
									<div class="sl-kind">Base plan</div>
								</div>
								<span class="sl-amt" data-num>{formatBaht(calc.base_premium)}</span>
							</div>
							{#each calc.rider_premiums as rp (rp.code)}
								<div class="sum-line">
									<div>
										<div class="sl-name">
											{data.riders.find((r) => r.code === rp.code)?.name ?? rp.code}
										</div>
										<div class="sl-kind">Rider</div>
									</div>
									<span class="sl-amt" data-num>{formatBaht(rp.premium)}</span>
								</div>
							{/each}
						</div>

						<div class="sum-total" data-testid="premium-total">
							<span>Total annual</span>
							<span class="total-amt" data-num>{formatBaht(calc.total_annual_premium)}</span>
						</div>
						<div class="sum-modal" data-testid="premium-modal">
							<span>{MODAL_LABELS[modal]} installment</span>
							<span class="modal-amt" data-num>{formatBaht(calc.modal_premium)}</span>
						</div>

						{#if isBug}
							<div class="thumb-broken" data-testid="illustration-thumb">
								<Icon name="alert-circle" size={22} stroke={1.8} />
								<span>Preview failed to load</span>
							</div>
						{/if}

						<button
							type="button"
							class="v-btn v-btn-primary v-btn-lg full"
							onclick={isBug ? undefined : confirm}
							data-testid="confirm-illustration-button"
							>Confirm &amp; create illustration<Icon name="plus" size={17} stroke={2.2} /></button
						>
						<button
							type="button"
							class="v-btn v-btn-secondary full recalc-again"
							onclick={recalc}
							disabled={busy || calculating}
							data-testid="recalculate-button">Recalculate</button
						>
					{:else}
						<p class="sum-empty">Set your coverage, then calculate to see the premium breakdown.</p>
						<button
							type="button"
							class="v-btn v-btn-primary v-btn-lg full"
							onclick={recalc}
							disabled={busy || calculating}
							data-testid="recalculate-button">Calculate premium</button
						>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1180px;
		margin: 0 auto;
	}
	.qhead {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}
	.insured {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.insured-name {
		font-size: var(--text-lg);
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.insured-meta {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}
	.qsteps {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.qstep {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 5px 11px;
		border-radius: 999px;
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--text-tertiary);
	}
	.qstep.active,
	.qstep.done {
		background: var(--brand-subtle);
		color: var(--brand);
	}
	.qdot {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--surface-overlay);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
	}
	.qdot.active,
	.qdot.done {
		background: var(--brand);
		color: var(--text-onbrand);
	}
	.qstep-rule {
		width: 14px;
		height: 1px;
		background: var(--border-default);
	}

	.sec-title {
		font-size: var(--text-md);
		font-weight: 600;
		margin: 0 0 3px;
	}
	.sec-sub {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		margin: 0 0 14px;
	}
	.grid2 {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px;
	}
	.grid3 {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 14px;
	}

	.pick-card {
		text-align: left;
		padding: 18px;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		cursor: pointer;
		color: inherit;
		display: flex;
		flex-direction: column;
		gap: 8px;
		transition: var(--transition-colors);
	}
	.pick-card:hover {
		border-color: var(--brand);
	}
	.pick-card:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.pick-card.row {
		flex-direction: row;
		align-items: center;
		gap: 14px;
	}
	.pick-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.pick-name {
		font-weight: 600;
		color: var(--text-primary);
	}
	.pick-desc {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin: 0;
		line-height: 1.5;
	}
	.pick-sub {
		font-size: var(--text-2xs);
		color: var(--text-tertiary);
		margin-top: 6px;
	}
	.pick-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: var(--text-xs);
		color: var(--text-secondary);
	}
	.dotsep {
		color: var(--text-tertiary);
	}
	.rider-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--accent-subtle);
		color: var(--accent);
		font-size: var(--text-2xs);
		font-weight: 600;
	}
	.plan-icon {
		width: 40px;
		height: 40px;
		flex: none;
		border-radius: var(--radius-md);
		background: var(--brand-subtle);
		color: var(--brand);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	:global(.muted) {
		color: var(--text-tertiary);
	}

	.cov-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 14px;
		flex-wrap: wrap;
	}
	.cov-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.cov-base {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.cov-base strong {
		color: var(--text-primary);
		font-weight: 600;
	}

	.cov-grid {
		display: grid;
		grid-template-columns: 1.6fr 1fr;
		gap: 18px;
		align-items: start;
	}
	.cov-grid.compact {
		grid-template-columns: 1fr;
	}
	.cov-forms {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.pad {
		padding: 22px;
	}
	.field {
		margin-bottom: 18px;
	}
	.field-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}
	.hint {
		font-size: var(--text-2xs);
		color: var(--text-tertiary);
	}
	.money {
		display: flex;
		align-items: center;
		gap: 8px;
		height: var(--control-h-md);
		padding: 0 14px;
		background: var(--surface-inset);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
	}
	.baht {
		color: var(--text-tertiary);
	}
	.money input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: var(--text-base);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.chip {
		padding: 8px 14px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-inset);
		color: var(--text-secondary);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: var(--transition-colors);
	}
	.chip:hover {
		border-color: var(--border-strong);
	}
	.chip.active {
		border-color: var(--brand);
		background: var(--brand-subtle);
		color: var(--brand);
	}
	.modal-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}
	.modal-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 14px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-inset);
		color: var(--text-secondary);
		font-family: var(--font-sans);
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: var(--transition-colors);
	}
	.modal-card.active {
		border-color: var(--brand);
		background: var(--brand-subtle);
		color: var(--brand);
	}
	.modal-detail {
		font-size: var(--text-xs);
		font-weight: 600;
		opacity: 0.85;
	}

	.riders-card {
		padding: 14px 16px 16px;
	}
	.rider-list {
		border-radius: var(--radius-md);
		overflow: hidden;
		box-shadow: var(--ring-inset);
	}
	.rider-cat {
		border-top: 1px solid var(--border-subtle);
	}
	.rider-cat:first-child {
		border-top: none;
	}
	.cat-head {
		display: flex;
		align-items: center;
		gap: 11px;
		width: 100%;
		padding: 12px 14px;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		color: inherit;
	}
	.cat-icon {
		width: 30px;
		height: 30px;
		flex: none;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.cat-name {
		flex: 1;
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
	}
	.cat-count {
		font-size: 10px;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 999px;
		background: var(--brand-subtle);
		color: var(--brand);
	}
	.cat-subtotal {
		width: 70px;
		text-align: right;
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
	}
	:global(.rot) {
		transform: rotate(180deg);
	}
	.cat-body {
		padding: 2px 14px 14px;
	}
	.rider-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.rider-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 10px 11px;
		border: 1.5px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-inset);
		cursor: pointer;
		text-align: left;
		color: inherit;
		transition: var(--transition-colors);
	}
	.rider-card:hover {
		border-color: var(--border-strong);
	}
	.rider-card.active {
		border-color: var(--brand);
		background: var(--brand-subtle);
	}
	.rc-top {
		display: flex;
		align-items: flex-start;
		gap: 6px;
	}
	.rc-name {
		flex: 1;
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}
	.rc-check {
		width: 16px;
		height: 16px;
		flex: none;
		border-radius: 50%;
		border: 1.5px solid var(--border-strong);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-onbrand);
	}
	.rc-check.active {
		border-color: var(--brand);
		background: var(--brand);
	}
	.rc-benefit {
		font-size: 10px;
		color: var(--text-tertiary);
		line-height: 1.3;
	}
	.rc-from {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--text-secondary);
		margin-top: 1px;
	}
	.cover-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		margin-top: 10px;
	}
	.cover-label {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
		color: var(--text-tertiary);
		flex: none;
	}
	.cover-chips {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}
	.cover-chip {
		height: 26px;
		padding: 0 10px;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--surface-inset);
		color: var(--text-secondary);
		font-size: 10px;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
		transition: var(--transition-colors);
	}
	.cover-chip.active {
		border-color: var(--brand);
		background: var(--brand-subtle);
		color: var(--brand);
	}

	.cov-summary {
		position: sticky;
		top: 84px;
	}
	.cov-grid.compact .cov-summary {
		position: static;
	}
	.summary {
		padding: 22px;
		background:
			linear-gradient(160deg, rgba(20, 182, 207, 0.08), transparent 60%), var(--surface-card);
		box-shadow: var(--ring-inset), var(--shadow-md);
	}
	.sum-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}
	.sum-head h3 {
		font-size: var(--text-md);
		font-weight: 600;
		margin: 0;
	}
	.sum-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 30px 0;
		color: var(--brand);
	}
	.sum-loading span {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.sum-lines {
		margin-bottom: 16px;
	}
	.sum-line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 9px 0;
		border-bottom: 1px solid var(--border-subtle);
	}
	.sl-name {
		font-size: var(--text-sm);
		color: var(--text-primary);
		font-weight: 500;
	}
	.sl-kind {
		font-size: var(--text-2xs);
		color: var(--text-tertiary);
	}
	.sl-amt {
		font-size: var(--text-sm);
		font-weight: 600;
	}
	.sum-total {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: 6px;
	}
	.sum-total span:first-child {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.total-amt {
		font-size: var(--text-2xl);
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.sum-modal {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 11px 14px;
		border-radius: var(--radius-md);
		background: var(--brand-subtle);
		margin-bottom: 18px;
		color: var(--brand);
	}
	.sum-modal span:first-child {
		font-size: var(--text-sm);
		font-weight: 500;
	}
	.modal-amt {
		font-size: var(--text-md);
		font-weight: 700;
	}
	.sum-empty {
		padding: 24px 0;
		text-align: center;
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		line-height: 1.5;
	}
	.full {
		width: 100%;
	}
	.recalc-again {
		height: 36px;
		margin-top: 10px;
		font-weight: 500;
		background: transparent;
	}
	.thumb-broken {
		margin-bottom: 14px;
		height: 90px;
		border-radius: var(--radius-md);
		background: repeating-linear-gradient(
			45deg,
			var(--surface-inset),
			var(--surface-inset) 8px,
			var(--surface-sunken) 8px,
			var(--surface-sunken) 16px
		);
		border: 1px dashed var(--border-strong);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		color: var(--text-tertiary);
		font-size: var(--text-2xs);
	}

	@media (max-width: 1024px) {
		.cov-grid {
			grid-template-columns: 1fr;
		}
		.cov-summary {
			position: static;
		}
		.grid3,
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.rider-cards {
			grid-template-columns: 1fr;
		}
		.modal-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
