<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let { form } = $props();

	const fieldError = (key: string) => form?.fieldErrors?.[key];
	const hasErr = (key: string) => Boolean(fieldError(key));
	const messages = m as unknown as Record<string, (p?: Record<string, string>) => string>;
	const msg = (key: string) => messages[key]?.({});

	const v = (key: string) => (form?.values?.[key as keyof typeof form.values] ?? '') as string;

	const baseInput =
		'w-full rounded-lg border px-3 py-2 text-slate-900 focus:outline-none focus:ring-1';
	const okBorder = 'border-slate-300 focus:border-slate-500 focus:ring-slate-500';
	const errBorder = 'border-red-400 focus:border-red-500 focus:ring-red-500';
</script>

<svelte:head><title>{m['leads.new']()} · {m['app.title']()}</title></svelte:head>

<div class="max-w-2xl mx-auto" data-testid="lead-new-page">
	<h1 data-testid="lead-new-page-title" class="text-2xl font-bold text-slate-900 mb-6">
		{m['leads.new']()}
	</h1>

	<form
		method="POST"
		data-sveltekit-reload
		class="space-y-5 bg-white border border-slate-200 rounded-xl p-6"
	>
		<!-- Full name -->
		<div>
			<label for="full_name" class="block text-sm font-medium text-slate-700 mb-1">
				{m['leads.full_name.label']()}
			</label>
			<input
				id="full_name"
				name="full_name"
				type="text"
				value={v('full_name')}
				placeholder={m['leads.full_name.placeholder']()}
				aria-required="true"
				aria-invalid={hasErr('full_name')}
				data-testid="lead-full-name-input"
				class="{baseInput} {hasErr('full_name') ? errBorder : okBorder}"
			/>
			{#if hasErr('full_name')}
				<p role="alert" data-testid="lead-full-name-error" class="mt-1 text-sm text-red-600">
					{msg(fieldError('full_name')!)}
				</p>
			{/if}
		</div>

		<!-- National ID -->
		<div>
			<label for="national_id" class="block text-sm font-medium text-slate-700 mb-1">
				{m['leads.national_id.label']()}
			</label>
			<input
				id="national_id"
				name="national_id"
				type="text"
				inputmode="numeric"
				pattern="[0-9]{13}"
				maxlength="13"
				value={v('national_id')}
				placeholder={m['leads.national_id.placeholder']()}
				aria-required="true"
				aria-invalid={hasErr('national_id')}
				data-testid="lead-national-id-input"
				class="{baseInput} {hasErr('national_id') ? errBorder : okBorder}"
			/>
			{#if hasErr('national_id')}
				<p role="alert" data-testid="lead-national-id-error" class="mt-1 text-sm text-red-600">
					{msg(fieldError('national_id')!)}
				</p>
			{/if}
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
			<!-- DOB -->
			<div>
				<label for="dob" class="block text-sm font-medium text-slate-700 mb-1">
					{m['leads.dob.label']()}
				</label>
				<input
					id="dob"
					name="dob"
					type="date"
					value={v('dob')}
					aria-required="true"
					aria-invalid={hasErr('dob')}
					data-testid="lead-dob-input"
					class="{baseInput} {hasErr('dob') ? errBorder : okBorder}"
				/>
				{#if hasErr('dob')}
					<p role="alert" data-testid="lead-dob-error" class="mt-1 text-sm text-red-600">
						{msg(fieldError('dob')!)}
					</p>
				{/if}
			</div>

			<!-- Gender -->
			<div>
				<label for="gender" class="block text-sm font-medium text-slate-700 mb-1">
					{m['leads.gender.label']()}
				</label>
				<select
					id="gender"
					name="gender"
					value={v('gender')}
					aria-required="true"
					data-testid="lead-gender-select"
					class="{baseInput} {okBorder} bg-white"
				>
					<option value="">—</option>
					<option value="male">{m['leads.gender.male']()}</option>
					<option value="female">{m['leads.gender.female']()}</option>
					<option value="other">{m['leads.gender.other']()}</option>
				</select>
			</div>
		</div>

		<!-- Phone -->
		<div>
			<label for="phone" class="block text-sm font-medium text-slate-700 mb-1">
				{m['leads.phone.label']()}
			</label>
			<input
				id="phone"
				name="phone"
				type="tel"
				inputmode="numeric"
				value={v('phone')}
				placeholder={m['leads.phone.placeholder']()}
				aria-required="true"
				aria-invalid={hasErr('phone')}
				data-testid="lead-phone-input"
				class="{baseInput} {hasErr('phone') ? errBorder : okBorder}"
			/>
			{#if hasErr('phone')}
				<p role="alert" data-testid="lead-phone-error" class="mt-1 text-sm text-red-600">
					{msg(fieldError('phone')!)}
				</p>
			{/if}
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
			<!-- Email -->
			<div>
				<label for="email" class="block text-sm font-medium text-slate-700 mb-1">
					{m['leads.email.label']()}
				</label>
				<input
					id="email"
					name="email"
					type="email"
					value={v('email')}
					aria-invalid={hasErr('email')}
					data-testid="lead-email-input"
					class="{baseInput} {hasErr('email') ? errBorder : okBorder}"
				/>
				{#if hasErr('email')}
					<p role="alert" data-testid="lead-email-error" class="mt-1 text-sm text-red-600">
						{msg(fieldError('email')!)}
					</p>
				{/if}
			</div>

			<!-- Occupation -->
			<div>
				<label for="occupation" class="block text-sm font-medium text-slate-700 mb-1">
					{m['leads.occupation.label']()}
				</label>
				<input
					id="occupation"
					name="occupation"
					type="text"
					value={v('occupation')}
					data-testid="lead-occupation-input"
					class="{baseInput} {okBorder}"
				/>
			</div>
		</div>

		<!-- Income -->
		<div>
			<label for="income" class="block text-sm font-medium text-slate-700 mb-1">
				{m['leads.income.label']()}
			</label>
			<input
				id="income"
				name="income"
				type="number"
				min="0"
				step="1000"
				value={v('income')}
				data-testid="lead-income-input"
				class="{baseInput} {okBorder}"
			/>
		</div>

		<div class="flex gap-3 pt-2">
			<button
				type="submit"
				data-testid="lead-submit-button"
				class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
			>
				{m['leads.submit']()}
			</button>
			<a
				href="/"
				data-testid="lead-cancel-button"
				class="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
			>
				{m['leads.cancel']()}
			</a>
		</div>
	</form>
</div>
