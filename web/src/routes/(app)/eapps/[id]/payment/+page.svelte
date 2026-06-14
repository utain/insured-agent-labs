<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const eapp = $derived(data.eapp);
	const quotation = $derived(data.quotation);
	const formatBaht = (n: number) => '฿' + n.toLocaleString();

	let paymentMethod = $state<'card' | 'bank_transfer' | 'promptpay'>('card');
	const paymentStatus = $derived(form?.payment?.status ?? null);
	const isPaid = $derived(paymentStatus === 'success');
</script>

<svelte:head><title>{m['payment.title']()} · {m['app.title']()}</title></svelte:head>

<div class="max-w-md mx-auto" data-testid="payment-page">
	<h1 data-testid="payment-page-title" class="text-2xl font-bold text-slate-900 mb-6">
		{m['payment.title']()}
	</h1>

	<div class="bg-white border border-slate-200 rounded-xl p-6">
		<!-- Amount -->
		<div class="mb-6 text-center">
			<p class="text-sm text-slate-500">{m['payment.amount']()}</p>
			<p class="text-3xl font-bold text-slate-900" data-testid="payment-amount-value" role="status">
				{formatBaht(quotation.calc?.modal_premium ?? 0)}
			</p>
		</div>

		{#if paymentStatus}
			<div
				role="alert"
				data-testid="payment-status-alert"
				class="mb-4 rounded-lg px-4 py-3 text-sm border {isPaid
					? 'bg-green-50 border-green-200 text-green-800'
					: paymentStatus === 'declined'
						? 'bg-red-50 border-red-200 text-red-800'
						: 'bg-yellow-50 border-yellow-200 text-yellow-800'}"
			>
				{m[`payment.status.${paymentStatus}`]()}
			</div>
		{/if}

		<form method="POST" action="?/pay" use:enhance class="space-y-4">
			<!-- Payment method -->
			<div>
				<label for="method" class="block text-sm font-medium text-slate-700 mb-1">
					{m['payment.method']()}
				</label>
				<select
					id="method"
					name="method"
					bind:value={paymentMethod}
					data-testid="payment-method-select"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
				>
					<option value="card">{m['payment.method.card']()}</option>
					<option value="bank_transfer">{m['payment.method.bank_transfer']()}</option>
					<option value="promptpay">{m['payment.method.promptpay']()}</option>
				</select>
			</div>

			<p class="text-xs text-slate-500 border-t border-slate-200 pt-3">
				{m['payment.simulate']()}
			</p>

			<!-- Mock gateway outcome buttons -->
			<div class="grid grid-cols-1 gap-2">
				<button
					type="submit"
					name="outcome"
					value="success"
					data-testid="payment-outcome-success-button"
					class="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
				>
					{m['payment.success']()}
				</button>
				<button
					type="submit"
					name="outcome"
					value="declined"
					data-testid="payment-outcome-declined-button"
					class="rounded-lg bg-red-100 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-200"
				>
					{m['payment.declined']()}
				</button>
				<button
					type="submit"
					name="outcome"
					value="pending"
					data-testid="payment-outcome-pending-button"
					class="rounded-lg bg-yellow-100 px-4 py-2.5 text-sm font-medium text-yellow-700 hover:bg-yellow-200"
				>
					{m['payment.pending']()}
				</button>
			</div>
		</form>

		{#if isPaid}
			<div class="mt-4 border-t border-slate-200 pt-4">
				<a
					href="/eapps/{eapp.id}"
					data-testid="payment-continue-button"
					class="block rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white text-center hover:bg-slate-800"
				>
					{m['payment.continue']()}
				</a>
			</div>
		{/if}
	</div>
</div>
