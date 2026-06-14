<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { enhance } from '$app/forms';
	import type { Modal, RiderSelection } from '$lib/types';

	type RiderSel = { on: boolean; sumAssured: number };

	let { data, form } = $props();

	const quotation = $derived(data.quotation);
	const product = $derived(data.products.find((p) => p.code === quotation.base_product_code)!);
	const isFinalized = $derived(quotation.status !== 'draft');
	const name = (en: string, th: string) => (getLocale() === 'th' ? th : en);
	const formatBaht = (n: number) => '฿' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });

	let step = $state(3); // start at riders step (insured+product already chosen)
	let sumAssured = $state(quotation.sum_assured);
	let term = $state(quotation.term);
	let modal = $state<Modal>(quotation.modal);
	let selectedRiders: Record<string, RiderSel> = $state({});

	// Init rider selections from existing quotation data.
	$effect(() => {
		for (const r of quotation.riders as RiderSelection[]) {
			if (!(r.code in selectedRiders)) {
				selectedRiders[r.code] = { on: true, sumAssured: r.sum_assured };
			}
		}
	});

	const riderTypes = ['health', 'ci', 'pa', 'tpd', 'wp'] as const;
	let activeRiderTab = $state<(typeof riderTypes)[number]>('health');
	const activeRiders = $derived(data.riders.filter((r) => r.rider_type === activeRiderTab));

	const riderSelections = $derived(
		Object.entries(selectedRiders)
			.filter(([, v]) => v.on)
			.map(([code, v]) => ({ code, sum_assured: v.sumAssured }))
	);

	const steps = [3, 4, 5]; // riders → summary → review
	const stepLabels: Record<number, string> = {
		1: m['quotation.wizard.step.1'](),
		2: m['quotation.wizard.step.2'](),
		3: m['quotation.wizard.step.3'](),
		4: m['quotation.wizard.step.4'](),
		5: m['quotation.wizard.step.5']()
	};
</script>

<svelte:head><title>{m['quotation.title']()} · {m['app.title']()}</title></svelte:head>

<div class="max-w-3xl mx-auto" data-testid="quotation-edit-page">
	<h1 data-testid="quotation-edit-page-title" class="text-2xl font-bold text-slate-900 mb-2">
		{m['quotation.title']()} — {quotation.insured_name}
	</h1>
	<p class="text-sm text-slate-500 mb-6" data-testid="quotation-edit-status">
		Status: <span class="font-medium uppercase">{quotation.status}</span>
	</p>

	<!-- Stepper -->
	<ol data-testid="quotation-stepper" class="flex items-center gap-2 mb-8">
		{#each steps as s, i (s)}
			<li class="flex items-center gap-2">
				<span
					data-testid="quotation-step-indicator-{s}"
					aria-current={step === s ? 'step' : undefined}
					class="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold {step ===
					s
						? 'bg-slate-900 text-white'
						: step > s
							? 'bg-green-500 text-white'
							: 'bg-slate-200 text-slate-500'}"
				>
					{s}
				</span>
				<span class="text-sm {step === s ? 'text-slate-900 font-medium' : 'text-slate-500'}">
					{stepLabels[s]}
				</span>
				{#if i < steps.length - 1}
					<span class="w-8 h-px bg-slate-200"></span>
				{/if}
			</li>
		{/each}
	</ol>

	{#if isFinalized}
		<!-- Finalized view -->
		<div class="bg-white border border-slate-200 rounded-xl p-6">
			<div
				role="status"
				data-testid="quotation-finalized-status"
				class="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
			>
				{m['quotation.step5.finalized']()}
			</div>
			<dl class="space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-slate-500">{m['quotation.view.total_premium']()}</dt>
					<dd class="font-semibold" data-testid="quotation-view-total-premium-value">
						{formatBaht(quotation.calc?.total_annual_premium ?? 0)}
					</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-slate-500">{m['quotation.step4.modal']()}</dt>
					<dd class="font-medium">{m[`quotation.step4.modal.${quotation.modal}`]()}</dd>
				</div>
				{#if quotation.valid_until}
					<div class="flex justify-between">
						<dt class="text-slate-500">{m['quotation.step5.valid_until']()}</dt>
						<dd class="font-medium" data-testid="quotation-view-valid-until">
							{new Date(quotation.valid_until).toLocaleDateString()}
						</dd>
					</div>
				{/if}
			</dl>

			<div class="mt-6 flex gap-3">
				<a
					href="/quotations/{quotation.id}/eapp"
					data-testid="quotation-view-create-eapp-button"
					class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
				>
					{m['quotation.view.create_eapp']()}
				</a>
				<a
					href="/"
					data-testid="quotation-view-back-button"
					class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
				>
					{m['quotation.view.back']()}
				</a>
			</div>
		</div>
	{:else}
		<!-- ===== Step 3: Riders ===== -->
		{#if step === 3}
			<section
				data-testid="quotation-step3"
				class="bg-white border border-slate-200 rounded-xl p-6"
			>
				<h2 class="text-lg font-semibold text-slate-900 mb-4">
					{m['quotation.step3.select_riders']()}
				</h2>

				<!-- Rider type tabs -->
				<div class="flex flex-wrap gap-2 mb-4" role="tablist">
					{#each riderTypes as rt (rt)}
						<button
							type="button"
							role="tab"
							aria-selected={activeRiderTab === rt}
							data-testid="quotation-step3-rider-type-tab-{rt}"
							onclick={() => (activeRiderTab = rt)}
							class="px-3 py-1.5 text-sm rounded-md border transition-colors {activeRiderTab === rt
								? 'bg-slate-900 text-white border-slate-900'
								: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}"
						>
							{m[`catalog.rider_type.${rt}`]()}
						</button>
					{/each}
				</div>

				<!-- Rider plans for active tab -->
				<div class="space-y-3">
					{#each activeRiders as rider (rider.code)}
						{@const sel = selectedRiders[rider.code] ?? {
							on: false,
							sumAssured: rider.sum_assured_options[0]
						}}
						<label
							data-testid="quotation-step3-rider-card-{rider.code}"
							class="flex items-start gap-3 p-3 border border-slate-200 rounded-lg {sel.on
								? 'bg-slate-50 border-slate-400'
								: 'bg-white'}"
						>
							<input
								type="checkbox"
								name="rider_code"
								value={rider.code}
								data-testid="quotation-step3-rider-toggle-{rider.code}"
								checked={sel.on}
								onchange={(e) => {
									selectedRiders[rider.code] = {
										on: (e.currentTarget as HTMLInputElement).checked,
										sumAssured: sel.sumAssured
									};
								}}
								class="mt-1"
							/>
							<div class="flex-1">
								<p class="text-sm font-medium text-slate-900">
									{name(rider.name_en, rider.name_th)}
								</p>
								{#if sel.on}
									<div class="mt-2">
										<label for="rider_sum_{rider.code}" class="text-xs text-slate-500">
											{m['quotation.step3.rider_sum_assured']()}
										</label>
										<select
											id="rider_sum_{rider.code}"
											name="rider_sum_{rider.code}"
											data-testid="quotation-step3-rider-sum-assured-{rider.code}"
											value={sel.sumAssured}
											onchange={(e) => {
												selectedRiders[rider.code] = {
													on: true,
													sumAssured: Number((e.currentTarget as HTMLSelectElement).value)
												};
											}}
											class="ml-2 text-sm rounded border border-slate-300 px-2 py-0.5 bg-white"
										>
											{#each rider.sum_assured_options as sa (sa)}
												<option value={sa}>{formatBaht(sa)}</option>
											{/each}
										</select>
									</div>
								{/if}
							</div>
						</label>
					{/each}
				</div>

				<p class="mt-4 text-sm text-slate-500" data-testid="quotation-step3-selected-count">
					{riderSelections.length} rider(s) selected
				</p>

				<button
					type="button"
					data-testid="quotation-next-button"
					onclick={() => (step = 4)}
					class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
				>
					{m['quotation.wizard.next']()}
				</button>
			</section>
		{/if}

		<!-- ===== Step 4: Summary + calc ===== -->
		{#if step === 4}
			<section
				data-testid="quotation-step4"
				class="bg-white border border-slate-200 rounded-xl p-6"
			>
				<h2 class="text-lg font-semibold text-slate-900 mb-4">
					{m['quotation.wizard.step.4']()}
				</h2>

				{#if form?.fieldErrors}
					{#each Object.entries(form.fieldErrors) as [field, msg] (field)}
						<div
							role="alert"
							data-testid="quotation-step4-error-{field}"
							class="mb-3 text-sm text-red-600"
						>
							{msg}
						</div>
					{/each}
				{/if}

				<form method="POST" action="?/update" use:enhance class="space-y-5">
					<!-- Hidden rider selections for the form post -->
					{#each riderSelections as rs (rs.code)}
						<input type="hidden" name="rider_code" value={rs.code} />
						<input type="hidden" name="rider_sum_{rs.code}" value={rs.sum_assured} />
					{/each}

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
						<div>
							<label for="sum_assured" class="block text-sm font-medium text-slate-700 mb-1">
								{m['quotation.step4.sum_assured']()}
							</label>
							<input
								id="sum_assured"
								name="sum_assured"
								type="number"
								min={product.min_sum_assured}
								max={product.max_sum_assured}
								step="50000"
								bind:value={sumAssured}
								data-testid="quotation-step4-sum-assured-input"
								class="w-full rounded-lg border border-slate-300 px-3 py-2"
							/>
						</div>
						<div>
							<label for="term" class="block text-sm font-medium text-slate-700 mb-1">
								{m['quotation.step4.term']()}
							</label>
							<select
								id="term"
								name="term"
								bind:value={term}
								data-testid="quotation-step4-term-select"
								class="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
							>
								{#each product.term_options as t (t)}
									<option value={t}>{t}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="modal" class="block text-sm font-medium text-slate-700 mb-1">
								{m['quotation.step4.modal']()}
							</label>
							<select
								id="modal"
								name="modal"
								bind:value={modal}
								data-testid="quotation-step4-modal-select"
								class="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
							>
								<option value="annual">{m['quotation.step4.modal.annual']()}</option>
								<option value="semi">{m['quotation.step4.modal.semi']()}</option>
								<option value="quarterly">{m['quotation.step4.modal.quarterly']()}</option>
								<option value="monthly">{m['quotation.step4.modal.monthly']()}</option>
							</select>
						</div>
					</div>

					<!-- Premium preview area -->
					<div
						data-testid="quotation-step4-calc-preview"
						class="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2"
					>
						<div class="flex justify-between text-sm">
							<span class="text-slate-600">{m['quotation.step4.base_premium']()}</span>
							<span
								class="font-medium"
								data-testid="quotation-step4-base-premium-value"
								role="status"
							>
								{formatBaht(
									form?.quotation?.calc?.base_premium ?? quotation.calc?.base_premium ?? 0
								)}
							</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-slate-600">{m['quotation.step4.total_premium']()}</span>
							<span
								class="font-bold text-lg"
								data-testid="quotation-step4-total-premium-value"
								role="status"
							>
								{formatBaht(
									form?.quotation?.calc?.total_annual_premium ??
										quotation.calc?.total_annual_premium ??
										0
								)}
							</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-slate-600">{m['quotation.step4.modal_premium']()}</span>
							<span
								class="font-medium"
								data-testid="quotation-step4-modal-premium-value"
								role="status"
							>
								{formatBaht(
									form?.quotation?.calc?.modal_premium ?? quotation.calc?.modal_premium ?? 0
								)}
							</span>
						</div>
					</div>

					<div class="flex justify-between">
						<button
							type="button"
							data-testid="quotation-back-button"
							onclick={() => (step = 3)}
							class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
						>
							{m['quotation.wizard.back']()}
						</button>
						<button
							type="submit"
							data-testid="quotation-step4-recalc-button"
							class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
						>
							{m['quotation.step4.recalc']()}
						</button>
					</div>
				</form>

				<div class="mt-4 border-t border-slate-200 pt-4">
					<button
						type="button"
						data-testid="quotation-next-button"
						onclick={() => (step = 5)}
						class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
					>
						{m['quotation.wizard.next']()}
					</button>
				</div>
			</section>
		{/if}

		<!-- ===== Step 5: Review ===== -->
		{#if step === 5}
			<section
				data-testid="quotation-step5"
				class="bg-white border border-slate-200 rounded-xl p-6"
			>
				<h2 class="text-lg font-semibold text-slate-900 mb-4">
					{m['quotation.wizard.step.5']()}
				</h2>

				<dl class="space-y-2 text-sm mb-6">
					<div class="flex justify-between">
						<dt class="text-slate-500">{m['quotation.step4.sum_assured']()}</dt>
						<dd class="font-medium" data-testid="quotation-step5-sum-assured-value">
							{formatBaht(sumAssured)}
						</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-500">{m['quotation.step4.term']()}</dt>
						<dd class="font-medium">{term} {m['quotation.step4.term']()}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-500">{m['quotation.step4.modal']()}</dt>
						<dd class="font-medium">{m[`quotation.step4.modal.${modal}`]()}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-500">{m['quotation.view.total_premium']()}</dt>
						<dd
							class="font-bold text-lg"
							data-testid="quotation-step5-total-premium-value"
							role="status"
						>
							{formatBaht(
								form?.quotation?.calc?.total_annual_premium ??
									quotation.calc?.total_annual_premium ??
									0
							)}
						</dd>
					</div>
				</dl>

				{#if form?.error}
					<div
						role="alert"
						data-testid="quotation-step5-error-alert"
						class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
					>
						{m['quotation.error.server']()}
					</div>
				{/if}

				<div class="flex justify-between">
					<button
						type="button"
						data-testid="quotation-back-button"
						onclick={() => (step = 4)}
						class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
					>
						{m['quotation.wizard.back']()}
					</button>
					<form method="POST" action="?/finalize" use:enhance>
						<button
							type="submit"
							data-testid="quotation-step5-finalize-button"
							class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
						>
							{m['quotation.step5.finalize']()}
						</button>
					</form>
				</div>
			</section>
		{/if}
	{/if}
</div>
