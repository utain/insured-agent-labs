<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
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

<svelte:head><title>New lead · Vesta AgentSured</title></svelte:head>

<div class="page" data-testid="lead-new-page">
	<h1 class="v-h1" data-testid="lead-new-page-title">New lead</h1>
	<p class="v-sub" style="margin:4px 0 22px;">Capture a new prospect's details.</p>

	<form method="POST" data-sveltekit-reload class="v-card form">
		{#if form?.error}
			<div class="v-alert-error" data-testid="lead-form-error">
				<Icon name="alert-circle" size={18} stroke={2} />
				<span>Please fix the highlighted fields below.</span>
			</div>
		{/if}

		<div>
			<label class="v-label" for="full_name">Full name</label>
			<input
				id="full_name"
				name="full_name"
				class="v-input"
				placeholder="e.g. Somchai Jaidee"
				value={v('full_name')}
				data-testid="lead-full-name-input"
			/>
			{#if err('full_name')}<span class="v-field-error" data-testid="lead-full-name-error"
					>{err('full_name')}</span
				>{/if}
		</div>

		<div class="grid2">
			<div>
				<label class="v-label" for="dob">Date of birth</label>
				<input
					id="dob"
					name="dob"
					type="date"
					class="v-input"
					value={v('dob')}
					data-testid="lead-dob-input"
				/>
				{#if err('dob')}<span class="v-field-error" data-testid="lead-dob-error">{err('dob')}</span
					>{/if}
			</div>
			<div>
				<label class="v-label" for="occupation">Occupation</label>
				<input
					id="occupation"
					name="occupation"
					class="v-input"
					placeholder="Optional"
					value={v('occupation')}
					data-testid="lead-occupation-input"
				/>
			</div>
		</div>

		<div>
			<span class="v-label">Gender</span>
			<RadioGroup name="gender" bind:value={gender} options={genderOptions} testid="lead-gender" />
		</div>

		<details class="more">
			<summary>Optional contact details</summary>
			<div class="more-body">
				<div>
					<label class="v-label" for="national_id">National ID</label>
					<input
						id="national_id"
						name="national_id"
						class="v-input"
						maxlength="13"
						inputmode="numeric"
						value={v('national_id')}
						data-testid="lead-national-id-input"
					/>
					{#if err('national_id')}<span class="v-field-error" data-testid="lead-national-id-error"
							>{err('national_id')}</span
						>{/if}
				</div>
				<div class="grid2">
					<div>
						<label class="v-label" for="phone">Phone</label>
						<input
							id="phone"
							name="phone"
							class="v-input"
							value={v('phone')}
							data-testid="lead-phone-input"
						/>
					</div>
					<div>
						<label class="v-label" for="email">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							class="v-input"
							value={v('email')}
							data-testid="lead-email-input"
						/>
						{#if err('email')}<span class="v-field-error" data-testid="lead-email-error"
								>{err('email')}</span
							>{/if}
					</div>
				</div>
			</div>
		</details>

		<div class="actions">
			<a href="/leads" class="v-btn v-btn-secondary" data-testid="lead-cancel-button">Cancel</a>
			<button type="submit" class="v-btn v-btn-primary" data-testid="lead-submit-button"
				>Save lead</button
			>
		</div>
	</form>
</div>

<style>
	.page {
		max-width: 620px;
		margin: 0 auto;
	}
	.form {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	.more {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.more summary {
		cursor: pointer;
		font-weight: 500;
		color: var(--text-secondary);
	}
	.more summary:hover {
		color: var(--text-primary);
	}
	.more-body {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		margin-top: 4px;
	}
	@media (max-width: 600px) {
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
</style>
