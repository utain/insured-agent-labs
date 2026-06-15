<script lang="ts">
	import { formatBaht } from '$lib/format';
	import RadioGroup from '$lib/components/RadioGroup.svelte';
	import {
		RIDER_TYPES,
		RIDER_TYPE_LABELS,
		MODAL_LABELS,
		MODALS,
		type CatalogProduct,
		type CatalogRiderPlan,
		type Modal,
		type Package,
		type RiderType
	} from '$lib/schemas';

	let {
		products,
		riders,
		pkg = null,
		form = null,
		submitLabel = 'Save package'
	}: {
		products: CatalogProduct[];
		riders: CatalogRiderPlan[];
		pkg?: Package | null;
		form?: { error?: string; fieldErrors?: Record<string, string> } | null;
		submitLabel?: string;
	} = $props();

	type Sel = { code: string; sum: number };
	function initial(): Partial<Record<RiderType, Sel>> {
		const out: Partial<Record<RiderType, Sel>> = {};
		for (const sel of pkg?.riders ?? []) {
			const plan = riders.find((r) => r.code === sel.code);
			if (plan) out[plan.rider_type] = { code: sel.code, sum: sel.sum_assured };
		}
		return out;
	}

	const initialProduct = pkg?.base_product_code ?? products[0]?.code ?? '';
	let baseProduct = $state(initialProduct);
	let term = $state(
		pkg?.term ?? products.find((p) => p.code === initialProduct)?.term_options[0] ?? 10
	);
	let modal = $state<Modal>(pkg?.modal ?? 'annual');
	let riderSel = $state<Partial<Record<RiderType, Sel>>>(initial());

	const selectedProduct = $derived(products.find((p) => p.code === baseProduct));
	const productOptions = products.map((p) => ({
		value: p.code,
		label: p.name,
		hint: `${formatBaht(p.min_sum_assured)}–${formatBaht(p.max_sum_assured)}`
	}));
	const modalOptions = MODALS.map((m) => ({ value: m, label: MODAL_LABELS[m] }));

	// Keep the term valid when the base plan changes.
	function onProductChange(code: string) {
		const p = products.find((x) => x.code === code);
		if (p && !p.term_options.includes(term)) term = p.term_options[0];
	}
	const ridersByType = (t: RiderType) => riders.filter((r) => r.rider_type === t);
	const ridersJson = $derived(
		JSON.stringify(
			Object.values(riderSel)
				.filter((s): s is Sel => !!s?.code)
				.map((s) => ({ code: s.code, sum_assured: s.sum }))
		)
	);

	function pick(t: RiderType, code: string) {
		if (!code) {
			delete riderSel[t];
			riderSel = { ...riderSel };
			return;
		}
		const plan = riders.find((r) => r.code === code)!;
		riderSel = {
			...riderSel,
			[t]: { code, sum: plan.flat_premium != null ? 0 : (plan.sum_assured_options[0] ?? 0) }
		};
	}
</script>

<form method="POST" data-sveltekit-reload class="card space-y-5 p-6" data-testid="package-form">
	{#if form?.error}<div class="alert-error">{form.error}</div>{/if}
	<input type="hidden" name="riders" value={ridersJson} />

	<div>
		<label class="field-label" for="name">Package name</label>
		<input
			id="name"
			name="name"
			class="field-input"
			value={pkg?.name ?? ''}
			data-testid="package-name"
		/>
		{#if form?.fieldErrors?.name}<p class="field-error">{form.fieldErrors.name}</p>{/if}
	</div>

	<div>
		<label class="field-label" for="description">Description</label>
		<input
			id="description"
			name="description"
			class="field-input"
			value={pkg?.description ?? ''}
			data-testid="package-description"
		/>
	</div>

	<div>
		<span class="field-label">Base life plan</span>
		<RadioGroup
			name="base_product_code"
			bind:value={baseProduct}
			options={productOptions}
			variant="tile"
			testid="package-product"
			onchange={onProductChange}
		/>
	</div>

	<div>
		<label class="field-label" for="default_sum_assured">Default sum insured</label>
		<input
			id="default_sum_assured"
			name="default_sum_assured"
			type="number"
			step="50000"
			class="field-input"
			value={pkg?.default_sum_assured ?? selectedProduct?.min_sum_assured ?? 1000000}
			data-testid="package-sum"
		/>
	</div>

	<div>
		<span class="field-label">Term</span>
		<RadioGroup
			name="term"
			bind:value={term}
			options={(selectedProduct?.term_options ?? []).map((t) => ({
				value: t,
				label: t >= 99 ? 'Whole life' : `${t} yrs`
			}))}
		/>
	</div>
	<div>
		<span class="field-label">Payment frequency</span>
		<RadioGroup name="modal" bind:value={modal} options={modalOptions} />
	</div>

	<div>
		<h3 class="field-label">Riders</h3>
		<div class="space-y-3">
			{#each RIDER_TYPES as t (t)}
				{@const sel = riderSel[t]}
				{@const plan = sel ? riders.find((r) => r.code === sel.code) : null}
				<div class="grid grid-cols-2 items-center gap-3">
					<label class="text-sm text-slate-700" for="pkg-rider-{t}">{RIDER_TYPE_LABELS[t]}</label>
					<div class="flex gap-2">
						<select
							id="pkg-rider-{t}"
							class="field-input bg-white"
							value={sel?.code ?? ''}
							onchange={(e) => pick(t, e.currentTarget.value)}
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

	<div class="flex gap-3 pt-2">
		<button type="submit" class="btn-primary" data-testid="package-submit">{submitLabel}</button>
		<a href="/packages" class="btn-secondary">Cancel</a>
	</div>
</form>
