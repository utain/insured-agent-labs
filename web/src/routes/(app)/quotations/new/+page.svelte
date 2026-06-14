<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const name = (en: string, th: string) => (getLocale() === 'th' ? th : en);
	const formatBaht = (n: number) => '฿' + n.toLocaleString();

	let selectedLead = $state<string>('');
	let selectedProduct = $state<string>('LIFE_TERM');
	let loading = $state(false);
</script>

<svelte:head><title>{m['quotation.new']()} · {m['app.title']()}</title></svelte:head>

<div class="max-w-3xl mx-auto" data-testid="quotation-new-page">
	<h1 data-testid="quotation-new-page-title" class="text-2xl font-bold text-slate-900 mb-6">
		{m['quotation.new']()}
	</h1>

	{#if form?.error}
		<div
			role="alert"
			data-testid="quotation-new-error-alert"
			class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
		>
			{form.error}
		</div>
	{/if}

	<!-- Step 1: select lead -->
	<section class="bg-white border border-slate-200 rounded-xl p-6 mb-6">
		<h2 class="text-lg font-semibold text-slate-900 mb-4" data-testid="quotation-step1-title">
			{m['quotation.step1.select_lead']()}
		</h2>
		{#if data.leads.length === 0}
			<p class="text-sm text-slate-500 mb-3" data-testid="quotation-step1-no-lead">
				{m['quotation.step1.no_lead']()}
			</p>
			<a
				href="/leads/new"
				data-testid="quotation-step1-create-lead"
				class="text-sm text-slate-900 underline"
			>
				{m['quotation.step1.create_lead']()}
			</a>
		{:else}
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						if (result.type === 'redirect' && result.location) {
							window.location.href = result.location;
						} else {
							await update();
						}
						loading = false;
					};
				}}
			>
				<div class="space-y-4">
					<div>
						<label for="leadId" class="block text-sm font-medium text-slate-700 mb-1">
							{m['quotation.step1.select_lead']()}
						</label>
						<select
							id="leadId"
							name="leadId"
							bind:value={selectedLead}
							data-testid="quotation-step1-lead-select"
							class="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
						>
							<option value="">—</option>
							{#each data.leads as lead (lead.id)}
								<option value={lead.id}>{lead.full_name} ({lead.national_id})</option>
							{/each}
						</select>
					</div>

					<!-- Step 2: select product -->
					<div>
						<label for="productCode" class="block text-sm font-medium text-slate-700 mb-1">
							{m['quotation.step2.select_product']()}
						</label>
						<select
							id="productCode"
							name="productCode"
							bind:value={selectedProduct}
							data-testid="quotation-step2-product-select"
							class="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
						>
							{#each data.products as product (product.code)}
								<option value={product.code}>{name(product.name_en, product.name_th)}</option>
							{/each}
						</select>
					</div>

					<button
						type="submit"
						disabled={!selectedLead || loading}
						data-testid="quotation-create-button"
						class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
					>
						{loading ? m['common.loading']() : m['quotation.wizard.next']()}
					</button>
				</div>
			</form>
		{/if}
	</section>

	<!-- Product reference cards -->
	<section>
		<h2 class="text-sm font-medium text-slate-700 mb-3">{m['quotation.step2.select_product']()}</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{#each data.products as product (product.code)}
				<div
					data-testid="quotation-step2-product-card-{product.code}"
					class="bg-white rounded-lg border border-slate-200 p-4"
				>
					<h3 class="text-sm font-semibold text-slate-900">
						{name(product.name_en, product.name_th)}
					</h3>
					<p class="mt-1 text-xs text-slate-600">
						{name(product.description_en, product.description_th)}
					</p>
					<p class="mt-2 text-xs text-slate-500">
						{formatBaht(product.min_sum_assured)} – {formatBaht(product.max_sum_assured)}
					</p>
				</div>
			{/each}
		</div>
	</section>
</div>
