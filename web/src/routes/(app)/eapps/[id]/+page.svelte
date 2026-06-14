<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const eapp = $derived(data.eapp);
	const quotation = $derived(data.quotation);
	const isSubmitted = $derived(eapp.status === 'submitted');
	const hasPayment = $derived(!!eapp.payment_id);

	type Ben = { name: string; relationship: string; national_id: string; share_pct: number };
	let beneficiaries = $state<Ben[]>(
		eapp.beneficiaries.length > 0
			? eapp.beneficiaries
			: [{ name: '', relationship: '', national_id: '', share_pct: 100 }]
	);
	const totalShare = $derived(beneficiaries.reduce((s, b) => s + (b.share_pct || 0), 0));
	const shareOk = $derived(Math.abs(totalShare - 100) < 0.01);

	// Health declarations
	const healthQs = ['q1', 'q2', 'q3'] as const;
	let healthAnswers = $state<Record<string, { answer: boolean; details: string }>>({});
	for (const h of eapp.health_declarations) {
		healthAnswers[h.question_id] = {
			answer: h.answer,
			details: h.details ?? ''
		};
	}

	function addBeneficiary() {
		beneficiaries = [
			...beneficiaries,
			{ name: '', relationship: '', national_id: '', share_pct: 0 }
		];
	}
	function removeBeneficiary(i: number) {
		beneficiaries = beneficiaries.filter((_, idx) => idx !== i);
	}
</script>

<svelte:head><title>{m['eapp.title']()} · {m['app.title']()}</title></svelte:head>

<div class="max-w-2xl mx-auto" data-testid="eapp-page">
	<h1 data-testid="eapp-page-title" class="text-2xl font-bold text-slate-900 mb-2">
		{m['eapp.title']()} — {quotation.insured_name}
	</h1>
	<p class="text-sm text-slate-500 mb-6" data-testid="eapp-page-status">
		Status: <span class="font-medium uppercase">{eapp.status}</span>
	</p>

	{#if isSubmitted && eapp.policy_number}
		<div
			role="status"
			data-testid="eapp-submitted-status"
			class="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
		>
			{m['eapp.submitted']()} <strong>{eapp.policy_number}</strong>
		</div>
		<a
			href="/policies/{eapp.id}"
			data-testid="eapp-view-policy-button"
			class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>
			{m['policy.title']()}
		</a>
	{:else}
		<form method="POST" action="?/save" use:enhance class="space-y-6">
			<input type="hidden" name="ben_count" value={beneficiaries.length} />

			<!-- Beneficiaries -->
			<section
				data-testid="eapp-beneficiaries-section"
				class="bg-white border border-slate-200 rounded-xl p-6"
			>
				<h2 class="text-lg font-semibold text-slate-900 mb-4">{m['eapp.beneficiaries']()}</h2>

				{#if !shareOk}
					<div
						role="alert"
						data-testid="eapp-beneficiary-total-share-error"
						class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700"
					>
						{m['eapp.beneficiary.share_error']()} ({totalShare.toFixed(1)}%)
					</div>
				{/if}

				<div class="space-y-4">
					{#each beneficiaries as ben, i (i)}
						<div
							data-testid="eapp-beneficiary-row-{i}"
							class="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded-lg"
						>
							<div>
								<label for="ben_name_{i}" class="block text-xs text-slate-500 mb-1">
									{m['eapp.beneficiary.name']()}
								</label>
								<input
									id="ben_name_{i}"
									name="ben_name_{i}"
									type="text"
									bind:value={ben.name}
									data-testid="eapp-beneficiary-name-input-{i}"
									class="w-full rounded border border-slate-300 px-2 py-1 text-sm"
								/>
							</div>
							<div>
								<label for="ben_rel_{i}" class="block text-xs text-slate-500 mb-1">
									{m['eapp.beneficiary.relationship']()}
								</label>
								<input
									id="ben_rel_{i}"
									name="ben_rel_{i}"
									type="text"
									bind:value={ben.relationship}
									data-testid="eapp-beneficiary-relationship-input-{i}"
									class="w-full rounded border border-slate-300 px-2 py-1 text-sm"
								/>
							</div>
							<div>
								<label for="ben_nid_{i}" class="block text-xs text-slate-500 mb-1">
									{m['eapp.beneficiary.national_id']()}
								</label>
								<input
									id="ben_nid_{i}"
									name="ben_nid_{i}"
									type="text"
									maxlength="13"
									bind:value={ben.national_id}
									data-testid="eapp-beneficiary-national-id-input-{i}"
									class="w-full rounded border border-slate-300 px-2 py-1 text-sm"
								/>
							</div>
							<div>
								<label for="ben_share_{i}" class="block text-xs text-slate-500 mb-1">
									{m['eapp.beneficiary.share_pct']()}
								</label>
								<input
									id="ben_share_{i}"
									name="ben_share_{i}"
									type="number"
									min="0"
									max="100"
									bind:value={ben.share_pct}
									data-testid="eapp-beneficiary-share-input-{i}"
									class="w-full rounded border border-slate-300 px-2 py-1 text-sm"
								/>
							</div>
							{#if beneficiaries.length > 1}
								<button
									type="button"
									data-testid="eapp-beneficiary-remove-button-{i}"
									onclick={() => removeBeneficiary(i)}
									class="col-span-2 text-xs text-red-600 hover:underline"
								>
									{m['eapp.beneficiary.remove']()}
								</button>
							{/if}
						</div>
					{/each}
				</div>

				<div class="mt-4 flex items-center justify-between">
					<button
						type="button"
						data-testid="eapp-beneficiary-add-button"
						onclick={addBeneficiary}
						class="text-sm text-slate-900 underline"
					>
						+ {m['eapp.beneficiary.add']()}
					</button>
					<span
						class="text-sm font-medium {shareOk ? 'text-green-600' : 'text-red-600'}"
						data-testid="eapp-beneficiary-total-share-value"
						role="status"
					>
						{m['eapp.beneficiary.total_share']()}: {totalShare.toFixed(1)}%
					</span>
				</div>
			</section>

			<!-- Health declaration -->
			<section
				data-testid="eapp-health-section"
				class="bg-white border border-slate-200 rounded-xl p-6"
			>
				<h2 class="text-lg font-semibold text-slate-900 mb-4">{m['eapp.health']()}</h2>
				<div class="space-y-5">
					{#each healthQs as qid (qid)}
						<div data-testid="eapp-health-question-{qid}">
							<p class="text-sm font-medium text-slate-700 mb-2">{m[`eapp.health.${qid}`]()}</p>
							<div class="flex gap-4 mb-2">
								<label class="flex items-center gap-1 text-sm">
									<input
										type="radio"
										name="health_{qid}"
										value="yes"
										checked={healthAnswers[qid]?.answer === true}
										onchange={() => {
											healthAnswers[qid] = {
												answer: true,
												details: healthAnswers[qid]?.details ?? ''
											};
											healthAnswers = { ...healthAnswers };
										}}
										data-testid="eapp-health-answer-yes-{qid}"
									/>
									{m['eapp.health.yes']()}
								</label>
								<label class="flex items-center gap-1 text-sm">
									<input
										type="radio"
										name="health_{qid}"
										value="no"
										checked={healthAnswers[qid]?.answer !== true}
										onchange={() => {
											healthAnswers[qid] = { answer: false, details: '' };
											healthAnswers = { ...healthAnswers };
										}}
										data-testid="eapp-health-answer-no-{qid}"
									/>
									{m['eapp.health.no']()}
								</label>
							</div>
							{#if healthAnswers[qid]?.answer}
								<textarea
									name="health_details_{qid}"
									placeholder={m['eapp.health.details']()}
									bind:value={healthAnswers[qid].details}
									data-testid="eapp-health-details-input-{qid}"
									class="w-full rounded border border-slate-300 px-2 py-1 text-sm"
									rows="2"
								></textarea>
							{/if}
						</div>
					{/each}
				</div>
			</section>

			{#if form?.fieldErrors}
				<div
					role="alert"
					data-testid="eapp-error-alert"
					class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
				>
					<ul>
						{#each Object.entries(form.fieldErrors) as [field, msg] (field)}
							<li data-testid="eapp-field-error-{field}">{msg}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="flex gap-3">
				<button
					type="submit"
					data-testid="eapp-save-button"
					class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
				>
					{m['eapp.save']()}
				</button>
				{#if hasPayment}
					<a
						href="/eapps/{eapp.id}/payment"
						data-testid="eapp-goto-payment-button"
						class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
					>
						{m['payment.title']()}
					</a>
				{/if}
			</div>
		</form>

		{#if form?.ok}
			<div
				role="status"
				data-testid="eapp-saved-status"
				class="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700"
			>
				{m['common.save']()} ✓ —
				<a
					href="/eapps/{eapp.id}/payment"
					data-testid="eapp-proceed-to-payment-button"
					class="underline font-medium"
				>
					{m['payment.title']()}
				</a>
			</div>
		{/if}
	{/if}
</div>
