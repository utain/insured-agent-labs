<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatBaht } from '$lib/format';
	import RadioGroup from '$lib/components/RadioGroup.svelte';
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
		annual: { unit: '/year', perYear: '1 payment / year' },
		semi: { unit: '/6 months', perYear: '2 payments / year' },
		quarterly: { unit: '/quarter', perYear: '4 payments / year' },
		monthly: { unit: '/month', perYear: '12 payments / year' }
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

	let sumAssured = $state(data.quotation.sum_assured || 0);
	let term = $state(data.quotation.term || 0);
	let modal = $state<Modal>(data.quotation.modal);
	let riderSel = $state<Partial<Record<RiderType, Sel>>>(ridersFrom(data.quotation));

	let busy = $state(false);
	let calculating = $state(false);
	let errors = $state<Record<string, string>>({});
	let generalError = $state('');

	const product = $derived(
		data.products.find((p) => p.code === quotation.base_product_code) ?? null
	);
	const ridersByType = (t: RiderType) => data.riders.filter((r) => r.rider_type === t);

	// Payment-frequency cards: show the actual amount due each installment once a
	// premium has been calculated, otherwise fall back to the payment cadence.
	const modalChoices = $derived(
		MODALS.map((m) => {
			const cadence = MODAL_CADENCE[m];
			const amount = calc ? calc.total_annual_premium * MODAL_FACTORS[m] : null;
			return {
				value: m,
				label: MODAL_LABELS[m],
				hint: amount != null ? `${formatBaht(amount)} ${cadence.unit}` : cadence.perYear
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
		if (!code) {
			delete riderSel[t];
			riderSel = { ...riderSel };
			return;
		}
		const plan = data.riders.find((r) => r.code === code)!;
		const sum = plan.flat_premium != null ? 0 : (plan.sum_assured_options[0] ?? 0);
		riderSel = { ...riderSel, [t]: { code, sum } };
	}
</script>

<svelte:head><title>Build quotation · InsureAgentLabs</title></svelte:head>

<div class="mx-auto max-w-3xl space-y-6" data-testid="quotation-detail-page">
	<div class="flex items-center justify-between">
		<div>
			<p class="text-sm font-medium text-indigo-600">Step {step === 'plan' ? '2' : '3'} of 3</p>
			<h1 class="text-2xl font-bold text-slate-900">
				{quotation.insured_name}
				<span class="text-base font-normal text-slate-500">· age {quotation.insured_age}</span>
			</h1>
		</div>
		<a href="/" class="btn-ghost text-sm">Exit</a>
	</div>

	{#if generalError}
		<div class="alert-error" data-testid="quotation-error">{generalError}</div>
	{/if}

	{#if step === 'plan'}
		{#if data.packages.length > 0}
			<section class="space-y-3">
				<h2 class="text-lg font-semibold text-slate-900">Start from a package</h2>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid="package-options">
					{#each data.packages as pkg (pkg.id)}
						<button
							type="button"
							onclick={() => applyPackage(pkg.id)}
							disabled={busy}
							class="card p-4 text-left transition hover:border-indigo-400 hover:shadow"
							data-testid="package-option"
						>
							<div class="font-semibold text-slate-900">{pkg.name}</div>
							<p class="mt-1 text-xs text-slate-500">{pkg.description}</p>
							<div class="mt-2 text-xs font-medium text-indigo-600">
								{pkg.base_product_code} · {pkg.riders.length} rider{pkg.riders.length === 1
									? ''
									: 's'}
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		<section class="space-y-3">
			<h2 class="text-lg font-semibold text-slate-900">Or pick a base life plan</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="product-options">
				{#each data.products as p (p.code)}
					<button
						type="button"
						onclick={() => selectProduct(p.code)}
						disabled={busy}
						class="card p-4 text-left transition hover:border-indigo-400 hover:shadow"
						data-testid="product-option"
						data-code={p.code}
					>
						<div class="font-semibold text-slate-900">{p.name}</div>
						<p class="mt-1 text-xs text-slate-500">{p.description}</p>
						<div class="mt-2 text-xs text-slate-400">
							{formatBaht(p.min_sum_assured)} – {formatBaht(p.max_sum_assured)}
						</div>
					</button>
				{/each}
			</div>
		</section>
	{:else if product}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
			<div class="space-y-5 lg:col-span-3">
				<div class="card p-5">
					<div class="flex items-center justify-between">
						<h2 class="text-lg font-semibold text-slate-900">{product.name}</h2>
						<button
							type="button"
							class="text-sm text-indigo-600 hover:underline"
							onclick={() => (step = 'plan')}>Change plan</button
						>
					</div>

					<div class="mt-4 space-y-4">
						<div>
							<label class="field-label" for="sum">Sum insured</label>
							<input
								id="sum"
								type="number"
								class="field-input"
								bind:value={sumAssured}
								min={product.min_sum_assured}
								max={product.max_sum_assured}
								step="50000"
								data-testid="coverage-sum-assured"
							/>
							{#if errors.sum_assured}<p class="field-error">{errors.sum_assured}</p>{/if}
						</div>
						<div>
							<span class="field-label">Term</span>
							<RadioGroup
								bind:value={term}
								options={product.term_options.map((t) => ({
									value: t,
									label: t >= 99 ? 'Whole life' : `${t} yrs`
								}))}
								testid="coverage-term"
							/>
							{#if errors.term}<p class="field-error">{errors.term}</p>{/if}
						</div>
						<div>
							<div class="mb-1 flex items-baseline justify-between">
								<span class="field-label mb-0">Payment frequency</span>
								<span class="text-xs text-slate-400">
									{calc ? 'amount shown per payment' : 'calculate to see amounts'}
								</span>
							</div>
							<RadioGroup
								bind:value={modal}
								options={modalChoices}
								variant="tile"
								columns={2}
								testid="coverage-modal"
							/>
						</div>
					</div>
				</div>

				<div class="card p-5">
					<h3 class="mb-3 font-semibold text-slate-900">Riders (add-on coverage)</h3>
					<div class="space-y-3" data-testid="rider-list">
						{#each RIDER_TYPES as t (t)}
							{@const sel = riderSel[t]}
							{@const plan = sel ? data.riders.find((r) => r.code === sel.code) : null}
							<div class="grid grid-cols-2 items-center gap-3">
								<label class="text-sm text-slate-700" for="rider-{t}">{RIDER_TYPE_LABELS[t]}</label>
								<div class="flex gap-2">
									<select
										id="rider-{t}"
										class="field-input bg-white"
										value={sel?.code ?? ''}
										onchange={(e) => pickRider(t, e.currentTarget.value)}
										data-testid="rider-select-{t}"
									>
										<option value="">None</option>
										{#each ridersByType(t) as p (p.code)}
											<option value={p.code}>{p.name}</option>
										{/each}
									</select>
									{#if sel && plan && plan.flat_premium == null}
										<select
											class="field-input bg-white"
											value={sel.sum}
											onchange={(e) =>
												(riderSel = {
													...riderSel,
													[t]: { code: sel.code, sum: Number(e.currentTarget.value) }
												})}
											data-testid="rider-sum-{t}"
										>
											{#each plan.sum_assured_options as opt (opt)}
												<option value={opt}>{formatBaht(opt)}</option>
											{/each}
										</select>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<button
					type="button"
					class="btn-secondary w-full"
					onclick={recalc}
					disabled={busy || calculating}
					data-testid="recalculate-button"
					>{calculating ? 'Calculating premium…' : 'Calculate premium'}</button
				>
			</div>

			<aside class="lg:col-span-2">
				<div class="card sticky top-6 p-5" data-testid="premium-summary">
					<h3 class="font-semibold text-slate-900">Premium</h3>
					{#if calculating}
						<p class="mt-4 text-sm text-slate-500" data-testid="premium-loading">Calculating…</p>
					{:else if calc}
						<dl class="mt-4 space-y-2 text-sm">
							<div class="flex justify-between">
								<dt class="text-slate-500">Base plan</dt>
								<dd class="font-medium" data-testid="premium-base">
									{formatBaht(calc.base_premium)}
								</dd>
							</div>
							{#each calc.rider_premiums as rp (rp.code)}
								<div class="flex justify-between">
									<dt class="text-slate-500">
										{data.riders.find((r) => r.code === rp.code)?.name ?? rp.code}
									</dt>
									<dd class="font-medium">{formatBaht(rp.premium)}</dd>
								</div>
							{/each}
							<div class="flex justify-between border-t border-slate-200 pt-2">
								<dt class="font-semibold text-slate-900">Total annual</dt>
								<dd class="font-bold text-slate-900" data-testid="premium-total">
									{formatBaht(calc.total_annual_premium)}
								</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-slate-500">{MODAL_LABELS[modal]} payment</dt>
								<dd class="font-medium" data-testid="premium-modal">
									{formatBaht(calc.modal_premium)}
								</dd>
							</div>
						</dl>

						{#if isBug}
							<!-- Scenario: broken illustration thumbnail for agent.bug -->
							<img
								src="/img/illustration-preview.png"
								alt="Illustration preview"
								class="mt-4 h-20 w-full rounded border border-slate-200 object-cover"
								data-testid="illustration-thumb"
							/>
						{/if}

						<button
							type="button"
							class="btn-primary mt-5 w-full"
							onclick={isBug ? undefined : confirm}
							data-testid="confirm-illustration-button">Confirm &amp; create illustration</button
						>
					{:else}
						<p class="mt-4 text-sm text-slate-500">
							Set coverage and calculate to see the premium.
						</p>
					{/if}
				</div>
			</aside>
		</div>
	{/if}
</div>
