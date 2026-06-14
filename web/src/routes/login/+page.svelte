<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';

	let { form } = $props();

	let loading = $state(false);

	const fieldError = (key: string) => form?.fieldErrors?.[key];
	const hasFieldError = (key: string) => Boolean(fieldError(key));
	const messages = m as unknown as Record<string, (p?: Record<string, string>) => string>;
	const msg = (key: string) => messages[key]?.({});
</script>

<svelte:head>
	<title>{m['login.title']()} · {m['app.title']()}</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-slate-900" data-testid="login-app-title">
				{m['app.title']()}
			</h1>
			<p class="mt-2 text-sm text-slate-600" data-testid="login-app-tagline">
				{m['login.subtitle']()}
			</p>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
			<h2 class="text-xl font-semibold text-slate-900 mb-6" data-testid="login-page-title">
				{m['login.title']()}
			</h2>

			{#if form?.error}
				<div
					role="alert"
					aria-live="assertive"
					data-testid="login-error-alert"
					class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
				>
					{msg(form.error)}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
				class="space-y-5"
			>
				<div>
					<label
						for="username"
						class="block text-sm font-medium text-slate-700 mb-1"
						data-testid="login-username-label"
					>
						{m['login.username.label']()}
					</label>
					<input
						id="username"
						name="username"
						type="text"
						autocomplete="username"
						value={form?.values?.username ?? ''}
						placeholder={m['login.username.placeholder']()}
						aria-required="true"
						aria-invalid={hasFieldError('username')}
						aria-describedby={hasFieldError('username') ? 'login-username-error' : undefined}
						data-testid="login-username-input"
						class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
					/>
					{#if hasFieldError('username')}
						<p
							id="login-username-error"
							role="alert"
							data-testid="login-username-error"
							class="mt-1 text-sm text-red-600"
						>
							{msg(fieldError('username')!)}
						</p>
					{/if}
				</div>

				<div>
					<label
						for="password"
						class="block text-sm font-medium text-slate-700 mb-1"
						data-testid="login-password-label"
					>
						{m['login.password.label']()}
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						placeholder={m['login.password.placeholder']()}
						aria-required="true"
						aria-invalid={hasFieldError('password')}
						aria-describedby={hasFieldError('password') ? 'login-password-error' : undefined}
						data-testid="login-password-input"
						class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
					/>
					{#if hasFieldError('password')}
						<p
							id="login-password-error"
							role="alert"
							data-testid="login-password-error"
							class="mt-1 text-sm text-red-600"
						>
							{msg(fieldError('password')!)}
						</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={loading}
					data-testid="login-submit-button"
					class="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{loading ? m['common.loading']() : m['login.submit']()}
				</button>
			</form>
		</div>

		<p class="mt-6 text-center text-xs text-slate-500" data-testid="login-hint">
			Test users: <code class="font-mono"
				>agent.standard / agent.locked / agent.glitch / agent.bug / agent.error</code
			>
			· password <code class="font-mono">insure_demo</code>
		</p>
	</div>
</div>
