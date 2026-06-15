<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	const testUsers = [
		['agent.standard', 'Happy path'],
		['agent.locked', 'Login is locked (423)'],
		['agent.glitch', 'Slow premium calculation'],
		['agent.bug', 'Premium inflated, dead button'],
		['agent.error', 'Illustration fails (500)']
	];

	let username = $state((form?.values?.username as string) ?? '');
	let loading = $state(false);
</script>

<svelte:head><title>Sign in · InsureAgentLabs</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white"
			>
				IA
			</div>
			<h1 class="text-xl font-bold text-slate-900" data-testid="login-app-title">
				InsureAgentLabs
			</h1>
			<p class="text-sm text-slate-500">Agent quotation portal</p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
			class="card space-y-4 p-6"
		>
			{#if form?.error}
				<div role="alert" class="alert-error" data-testid="login-error-alert">{form.error}</div>
			{/if}

			<div>
				<label class="field-label" for="username">Username</label>
				<input
					id="username"
					name="username"
					class="field-input"
					autocomplete="username"
					bind:value={username}
					data-testid="login-username-input"
				/>
			</div>

			<div>
				<label class="field-label" for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					class="field-input"
					autocomplete="current-password"
					data-testid="login-password-input"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="btn-primary w-full"
				data-testid="login-submit-button">{loading ? 'Signing in…' : 'Sign in'}</button
			>
		</form>

		<div class="card mt-4 p-4">
			<p class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
				Demo agents · password <code class="rounded bg-slate-100 px-1">insure_demo</code>
			</p>
			<ul class="space-y-1 text-sm">
				{#each testUsers as [u, note] (u)}
					<li class="flex items-center justify-between gap-2">
						<button
							type="button"
							class="font-mono text-indigo-600 hover:underline"
							onclick={() => (username = u)}>{u}</button
						>
						<span class="text-xs text-slate-400">{note}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
