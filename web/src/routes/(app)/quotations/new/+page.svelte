<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import RadioGroup from '$lib/components/RadioGroup.svelte';
	import { GENDERS } from '$lib/schemas';

	let { data, form } = $props();

	let mode = $state<'existing' | 'fresh'>(
		data.preselectLeadId || data.leads.length > 0 ? 'existing' : 'fresh'
	);
	let leadId = $state<string>(data.preselectLeadId ?? '');
	let gender = $state('male');
	const genderOptions = GENDERS.map((g) => ({
		value: g as string,
		label: g[0].toUpperCase() + g.slice(1)
	}));
	const err = (k: string) => form?.fieldErrors?.[k] as string | undefined;

	const steps = [
		{ n: '1', label: 'Insured' },
		{ n: '2', label: 'Plan' },
		{ n: '3', label: 'Coverage' }
	];
</script>

<svelte:head><title>New quotation · Vesta AgentSured</title></svelte:head>

<div class="page" data-testid="quotation-new-page">
	<div class="steps">
		{#each steps as s, i (s.n)}
			{#if i > 0}<span class="step-rule"></span>{/if}
			<span class="step" class:active={i === 0}>
				<span class="step-num" class:active={i === 0}>{s.n}</span>{s.label}
			</span>
		{/each}
	</div>

	<h1 class="v-h1" data-testid="quotation-new-page-title">Who are we insuring?</h1>
	<p class="v-sub" style="margin:4px 0 22px;">
		Pick an existing lead or enter the insured's details directly.
	</p>

	{#if form?.error}
		<div class="v-alert-error" data-testid="quotation-new-error-alert" style="margin-bottom:18px;">
			<Icon name="alert-circle" size={18} stroke={2} />
			<span>{form.error}</span>
		</div>
	{/if}

	<form method="POST" data-sveltekit-reload class="v-card card">
		<input type="hidden" name="mode" value={mode} />

		<div class="v-seg mode">
			<button
				type="button"
				class:is-active={mode === 'existing'}
				onclick={() => (mode = 'existing')}
				data-testid="quotation-mode-existing">Existing lead</button
			>
			<button
				type="button"
				class:is-active={mode === 'fresh'}
				onclick={() => (mode = 'fresh')}
				data-testid="quotation-mode-fresh">Start fresh</button
			>
		</div>

		{#if mode === 'existing'}
			{#if data.leads.length === 0}
				<div class="no-lead" data-testid="quotation-step1-no-lead">
					<p>You have no leads yet.</p>
					<button type="button" class="v-btn v-btn-secondary" onclick={() => (mode = 'fresh')}
						>Start fresh instead</button
					>
				</div>
			{:else}
				<div>
					<label class="v-label" for="lead_id">Lead</label>
					<select
						id="lead_id"
						name="lead_id"
						class="v-input"
						bind:value={leadId}
						data-testid="quotation-lead-select"
					>
						<option value="">—</option>
						{#each data.leads as lead (lead.id)}
							<option value={lead.id}>{lead.full_name} · {lead.occupation ?? 'n/a'}</option>
						{/each}
					</select>
					{#if err('')}<span class="v-field-error">{err('')}</span>{/if}
				</div>
			{/if}
		{:else}
			<div class="fresh">
				<div>
					<label class="v-label" for="full_name">Full name</label>
					<input
						id="full_name"
						name="full_name"
						class="v-input"
						placeholder="Insured's full name"
						data-testid="quotation-insured-name"
					/>
					{#if err('insured.full_name')}<span class="v-field-error">{err('insured.full_name')}</span
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
							data-testid="quotation-insured-dob"
						/>
						{#if err('insured.dob')}<span class="v-field-error">{err('insured.dob')}</span>{/if}
					</div>
					<div>
						<label class="v-label" for="occupation">Occupation</label>
						<input
							id="occupation"
							name="occupation"
							class="v-input"
							placeholder="Optional"
							data-testid="quotation-insured-occupation"
						/>
					</div>
				</div>
				<div>
					<span class="v-label">Gender</span>
					<RadioGroup
						name="gender"
						bind:value={gender}
						options={genderOptions}
						testid="quotation-insured-gender"
					/>
				</div>
			</div>
		{/if}

		<div class="actions">
			<a href="/" class="v-btn v-btn-secondary">Cancel</a>
			<button
				type="submit"
				class="v-btn v-btn-primary"
				disabled={mode === 'existing' && !leadId}
				data-testid="quotation-create-button"
				>Continue to plan<Icon name="chevron-right" size={16} stroke={2.2} /></button
			>
		</div>
	</form>
</div>

<style>
	.page {
		max-width: 680px;
		margin: 0 auto;
	}
	.steps {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 22px;
	}
	.step {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 5px 12px;
		border-radius: 999px;
		color: var(--text-tertiary);
		font-size: var(--text-xs);
		font-weight: 600;
	}
	.step.active {
		background: var(--brand-subtle);
		color: var(--brand);
	}
	.step-num {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--surface-overlay);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
	}
	.step-num.active {
		background: var(--brand);
		color: var(--text-onbrand);
	}
	.step-rule {
		width: 18px;
		height: 1px;
		background: var(--border-default);
	}

	.card {
		padding: 24px;
	}
	.mode {
		margin-bottom: 22px;
	}
	.no-lead {
		padding: 24px;
		text-align: center;
		border: 1px dashed var(--border-default);
		border-radius: var(--radius-md);
	}
	.no-lead p {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 0 0 12px;
	}
	.fresh {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	.actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
		margin-top: 24px;
	}
	@media (max-width: 600px) {
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
</style>
