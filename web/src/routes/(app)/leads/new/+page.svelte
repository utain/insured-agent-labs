<script lang="ts">
	import RadioGroup from '$lib/components/RadioGroup.svelte';
	import { GENDERS } from '$lib/schemas';

	let { form } = $props();
	const err = (k: string) => form?.fieldErrors?.[k] as string | undefined;
	const v = (k: string) => (form?.values?.[k] ?? '') as string;

	const genderOptions = GENDERS.map((g) => ({
		value: g as string,
		label: g[0].toUpperCase() + g.slice(1)
	}));
	let gender = $state((form?.values?.gender as string) ?? '');
</script>

<svelte:head><title>New lead · InsureAgentLabs</title></svelte:head>

<div class="mx-auto max-w-2xl" data-testid="lead-new-page">
	<a href="/leads" class="text-sm text-slate-500 hover:underline">← Back to leads</a>
	<h1 data-testid="lead-new-page-title" class="mt-2 mb-6 text-2xl font-bold text-slate-900">
		New lead
	</h1>

	<form method="POST" data-sveltekit-reload class="card space-y-5 p-6">
		{#if form?.error}
			<div class="alert-error" data-testid="lead-form-error">{form.error}</div>
		{/if}

		<div>
			<label class="field-label" for="full_name">Full name</label>
			<input
				id="full_name"
				name="full_name"
				class="field-input"
				value={v('full_name')}
				data-testid="lead-full-name-input"
			/>
			{#if err('full_name')}<p class="field-error" data-testid="lead-full-name-error">
					{err('full_name')}
				</p>{/if}
		</div>

		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
			<div>
				<label class="field-label" for="dob">Date of birth</label>
				<input
					id="dob"
					name="dob"
					type="date"
					class="field-input"
					value={v('dob')}
					data-testid="lead-dob-input"
				/>
				{#if err('dob')}<p class="field-error" data-testid="lead-dob-error">{err('dob')}</p>{/if}
			</div>
			<div>
				<span class="field-label">Gender</span>
				<RadioGroup
					name="gender"
					bind:value={gender}
					options={genderOptions}
					testid="lead-gender"
				/>
			</div>
		</div>

		<div>
			<label class="field-label" for="occupation"
				>Occupation <span class="text-slate-400">(for risk)</span></label
			>
			<input
				id="occupation"
				name="occupation"
				class="field-input"
				value={v('occupation')}
				data-testid="lead-occupation-input"
			/>
		</div>

		<details class="text-sm text-slate-600">
			<summary class="cursor-pointer font-medium">Optional contact details</summary>
			<div class="mt-4 space-y-5">
				<div>
					<label class="field-label" for="national_id">National ID</label>
					<input
						id="national_id"
						name="national_id"
						class="field-input"
						maxlength="13"
						inputmode="numeric"
						value={v('national_id')}
						data-testid="lead-national-id-input"
					/>
					{#if err('national_id')}<p class="field-error" data-testid="lead-national-id-error">
							{err('national_id')}
						</p>{/if}
				</div>
				<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
					<div>
						<label class="field-label" for="phone">Phone</label>
						<input
							id="phone"
							name="phone"
							class="field-input"
							value={v('phone')}
							data-testid="lead-phone-input"
						/>
					</div>
					<div>
						<label class="field-label" for="email">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							class="field-input"
							value={v('email')}
							data-testid="lead-email-input"
						/>
						{#if err('email')}<p class="field-error" data-testid="lead-email-error">
								{err('email')}
							</p>{/if}
					</div>
				</div>
			</div>
		</details>

		<div class="flex gap-3 pt-2">
			<button type="submit" class="btn-primary" data-testid="lead-submit-button">Save lead</button>
			<a href="/leads" class="btn-secondary" data-testid="lead-cancel-button">Cancel</a>
		</div>
	</form>
</div>
