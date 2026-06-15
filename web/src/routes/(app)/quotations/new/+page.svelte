<script lang="ts">
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
</script>

<svelte:head><title>New quotation · InsureAgentLabs</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-6" data-testid="quotation-new-page">
	<div>
		<p class="text-sm font-medium text-indigo-600">Step 1 of 3</p>
		<h1 data-testid="quotation-new-page-title" class="text-2xl font-bold text-slate-900">
			Who are we insuring?
		</h1>
	</div>

	{#if form?.error}
		<div class="alert-error" data-testid="quotation-new-error-alert">{form.error}</div>
	{/if}

	<div class="flex gap-2">
		<button
			type="button"
			class={mode === 'existing' ? 'btn-primary' : 'btn-secondary'}
			onclick={() => (mode = 'existing')}
			data-testid="quotation-mode-existing">Existing lead</button
		>
		<button
			type="button"
			class={mode === 'fresh' ? 'btn-primary' : 'btn-secondary'}
			onclick={() => (mode = 'fresh')}
			data-testid="quotation-mode-fresh">Start fresh</button
		>
	</div>

	<form method="POST" data-sveltekit-reload class="card space-y-5 p-6">
		<input type="hidden" name="mode" value={mode} />

		{#if mode === 'existing'}
			{#if data.leads.length === 0}
				<p class="text-sm text-slate-500" data-testid="quotation-step1-no-lead">
					No leads yet. <a href="/leads/new" class="text-indigo-600 underline">Create one</a> or start
					fresh.
				</p>
			{:else}
				<div>
					<label class="field-label" for="lead_id">Select lead / customer</label>
					<select
						id="lead_id"
						name="lead_id"
						class="field-input bg-white"
						bind:value={leadId}
						data-testid="quotation-lead-select"
					>
						<option value="">—</option>
						{#each data.leads as lead (lead.id)}
							<option value={lead.id}>{lead.full_name} · {lead.occupation ?? 'n/a'}</option>
						{/each}
					</select>
					{#if err('')}<p class="field-error">{err('')}</p>{/if}
				</div>
			{/if}
		{:else}
			<div>
				<label class="field-label" for="full_name">Full name</label>
				<input
					id="full_name"
					name="full_name"
					class="field-input"
					data-testid="quotation-insured-name"
				/>
				{#if err('insured.full_name')}<p class="field-error">{err('insured.full_name')}</p>{/if}
			</div>
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<div>
					<label class="field-label" for="dob">Date of birth</label>
					<input
						id="dob"
						name="dob"
						type="date"
						class="field-input"
						data-testid="quotation-insured-dob"
					/>
					{#if err('insured.dob')}<p class="field-error">{err('insured.dob')}</p>{/if}
				</div>
				<div>
					<span class="field-label">Gender</span>
					<RadioGroup
						name="gender"
						bind:value={gender}
						options={genderOptions}
						testid="quotation-insured-gender"
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
					data-testid="quotation-insured-occupation"
				/>
			</div>
		{/if}

		<div class="flex gap-3 pt-2">
			<button
				type="submit"
				class="btn-primary"
				disabled={mode === 'existing' && !leadId}
				data-testid="quotation-create-button">Continue to plan</button
			>
			<a href="/" class="btn-secondary">Cancel</a>
		</div>
	</form>
</div>
