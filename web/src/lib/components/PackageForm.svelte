<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import RadioGroup from '$lib/components/RadioGroup.svelte';
	import { formatBaht } from '$lib/format';
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

<form method="POST" data-sveltekit-reload class="v-card form" data-testid="package-form">
	{#if form?.error}
		<div class="v-alert-error">
			<Icon name="alert-circle" size={18} stroke={2} /><span>{form.error}</span>
		</div>
	{/if}
	<input type="hidden" name="riders" value={ridersJson} />

	<div>
		<label class="v-label" for="name">Name</label>
		<input
			id="name"
			name="name"
			class="v-input"
			placeholder="e.g. Family Protector"
			value={pkg?.name ?? ''}
			data-testid="package-name"
		/>
		{#if form?.fieldErrors?.name}<span class="v-field-error">{form.fieldErrors.name}</span>{/if}
	</div>

	<div>
		<label class="v-label" for="description">Description</label>
		<input
			id="description"
			name="description"
			class="v-input"
			placeholder="Optional summary"
			value={pkg?.description ?? ''}
			data-testid="package-description"
		/>
	</div>

	<div>
		<span class="v-label">Base life plan</span>
		<RadioGroup
			name="base_product_code"
			bind:value={baseProduct}
			options={productOptions}
			variant="tile"
			testid="package-product"
			onchange={onProductChange}
		/>
	</div>

	<div class="grid2">
		<div>
			<label class="v-label" for="default_sum_assured">Default sum insured</label>
			<div class="money">
				<span class="baht">฿</span>
				<input
					id="default_sum_assured"
					name="default_sum_assured"
					type="number"
					step="50000"
					value={pkg?.default_sum_assured ?? selectedProduct?.min_sum_assured ?? 1000000}
					data-testid="package-sum"
					data-num
				/>
			</div>
		</div>
		<div>
			<span class="v-label">Term</span>
			<RadioGroup
				name="term"
				bind:value={term}
				options={(selectedProduct?.term_options ?? []).map((t) => ({
					value: t,
					label: t >= 99 ? 'Whole life' : `${t} yrs`
				}))}
			/>
		</div>
	</div>

	<div>
		<span class="v-label">Payment frequency</span>
		<RadioGroup name="modal" bind:value={modal} options={modalOptions} />
	</div>

	<div class="rule"></div>

	<div>
		<div class="v-eyebrow" style="margin-bottom:12px;">Riders</div>
		<div class="riders" data-testid="package-riders">
			{#each RIDER_TYPES as t (t)}
				{@const sel = riderSel[t]}
				{@const plan = sel ? riders.find((r) => r.code === sel.code) : null}
				<div class="rider-row">
					<span class="rider-label">{RIDER_TYPE_LABELS[t]}</span>
					<div class="rider-controls">
						<select
							class="v-input"
							value={sel?.code ?? ''}
							onchange={(e) => pick(t, e.currentTarget.value)}
							data-testid="package-rider-{t}"
						>
							<option value="">None</option>
							{#each ridersByType(t) as p (p.code)}
								<option value={p.code}>{p.name}</option>
							{/each}
						</select>
						{#if sel && plan && plan.flat_premium == null}
							<select
								class="v-input"
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

	<div class="actions">
		<a href="/packages" class="v-btn v-btn-secondary">Cancel</a>
		<button type="submit" class="v-btn v-btn-primary" data-testid="package-submit"
			>{submitLabel}</button
		>
	</div>
</form>

<style>
	.form {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: 16px;
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
	.rule {
		height: 1px;
		background: var(--border-subtle);
	}
	.riders {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.rider-row {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		align-items: center;
		gap: 12px;
	}
	.rider-label {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
	}
	.rider-controls {
		display: flex;
		gap: 8px;
	}
	.actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		margin-top: 6px;
	}
	@media (max-width: 600px) {
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
</style>
