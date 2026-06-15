<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import { SCENARIO_COLORS } from '$lib/format';
	import type { ScenarioFlag } from '$lib/schemas';

	let { form } = $props();

	const demoAgents: { flag: ScenarioFlag; username: string }[] = [
		{ flag: 'standard', username: 'agent.standard' },
		{ flag: 'locked', username: 'agent.locked' },
		{ flag: 'glitch', username: 'agent.glitch' },
		{ flag: 'bug', username: 'agent.bug' },
		{ flag: 'error', username: 'agent.error' }
	];

	let username = $state((form?.values?.username as string) ?? '');
	let loading = $state(false);
</script>

<svelte:head><title>Sign in · Vesta AgentSured</title></svelte:head>

<div class="login">
	<!-- Brand panel -->
	<div class="brand-panel no-print">
		<div class="brand-head">
			<img src="/vesta-mark.svg" width="40" height="40" alt="" />
			<div class="brand-lock">
				<span class="brand-name">Vesta AgentSured</span>
				<span class="v-eyebrow">Agent Portal</span>
			</div>
		</div>

		<div class="pitch">
			<div class="live-pill">
				<span class="live-dot"><span class="dot-core"></span><span class="dot-pulse"></span></span>
				QA Training Sandbox
			</div>
			<h1>Quote, illustrate, and close — without the busywork.</h1>
			<p>
				The workspace for insurance agents: manage leads, build quotations through a guided wizard,
				and generate printable sales illustrations. Five demo agents, five scripted behaviours.
			</p>
		</div>

		<div class="brand-stats">
			<div><span data-num>4</span> life plans</div>
			<div><span data-num>27</span> riders</div>
			<div><span data-num>THB</span> currency</div>
		</div>
	</div>

	<!-- Form panel -->
	<div class="form-panel">
		<div class="form-inner">
			<h2 class="form-title" data-testid="login-app-title">Sign in</h2>
			<p class="form-lede">Welcome back. Choose a demo agent below or enter credentials.</p>

			{#if form?.error}
				<div class="v-alert-error" data-testid="login-error-alert" style="margin-bottom:18px;">
					<Icon name="alert-circle" size={18} stroke={2} />
					<span>{form.error}</span>
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
				class="login-form"
			>
				<div>
					<label class="v-label" for="username">Username</label>
					<input
						id="username"
						name="username"
						class="v-input v-input-lg"
						autocomplete="username"
						placeholder="agent.standard"
						bind:value={username}
						data-testid="login-username-input"
					/>
				</div>
				<div>
					<label class="v-label" for="password">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						class="v-input v-input-lg"
						autocomplete="current-password"
						placeholder="insure_demo"
						data-testid="login-password-input"
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					class="v-btn v-btn-primary v-btn-lg"
					data-testid="login-submit-button">{loading ? 'Signing in…' : 'Sign in'}</button
				>
			</form>

			<div class="demo">
				<div class="demo-head">
					<span class="v-eyebrow">Demo agents</span>
					<span class="rule"></span>
					<span class="demo-pw"
						>pw <span data-num style="color:var(--text-secondary)">insure_demo</span></span
					>
				</div>
				<div class="demo-list">
					{#each demoAgents as ag (ag.username)}
						{@const meta = SCENARIO_COLORS[ag.flag]}
						<button type="button" class="demo-agent" onclick={() => (username = ag.username)}>
							<span class="agent-dot" style="background:{meta.dot}"></span>
							<span class="agent-user">{ag.username}</span>
							<span class="agent-note">{meta.note}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.login {
		min-height: 100vh;
		display: grid;
		grid-template-columns: 1.05fr 0.95fr;
	}
	.brand-panel {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 48px;
		overflow: hidden;
		background:
			radial-gradient(120% 90% at 12% 8%, rgba(20, 182, 207, 0.16), transparent 55%),
			radial-gradient(90% 80% at 92% 96%, rgba(116, 88, 238, 0.18), transparent 52%),
			var(--surface-sunken);
		border-right: 1px solid var(--border-subtle);
	}
	.brand-head {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.brand-lock {
		display: flex;
		flex-direction: column;
		line-height: 1;
		gap: 5px;
	}
	.brand-name {
		font-size: var(--text-md);
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.pitch {
		max-width: 440px;
	}
	.live-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 4px 12px;
		border-radius: 999px;
		background: var(--brand-subtle);
		color: var(--brand);
		font-size: var(--text-2xs);
		font-weight: 600;
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
		margin-bottom: 22px;
	}
	.live-dot {
		position: relative;
		width: 7px;
		height: 7px;
		display: inline-block;
	}
	.dot-core,
	.dot-pulse {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: var(--brand);
	}
	.dot-pulse {
		animation: vsPulse 1.8s ease-out infinite;
	}
	.pitch h1 {
		font-size: var(--text-4xl);
		line-height: 1.05;
		letter-spacing: var(--tracking-tighter);
		font-weight: 700;
		margin: 0 0 16px;
	}
	.pitch p {
		font-size: var(--text-md);
		line-height: 1.55;
		color: var(--text-secondary);
	}
	.brand-stats {
		display: flex;
		gap: 32px;
		color: var(--text-tertiary);
		font-size: var(--text-sm);
	}
	.brand-stats span {
		color: var(--text-primary);
		font-weight: 600;
	}

	.form-panel {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 48px;
		background: var(--surface-app);
	}
	.form-inner {
		width: 100%;
		max-width: 380px;
	}
	.form-title {
		font-size: var(--text-2xl);
		font-weight: 700;
		letter-spacing: -0.01em;
		margin: 0 0 6px;
	}
	.form-lede {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 0 0 28px;
	}
	.login-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.demo {
		margin-top: 28px;
	}
	.demo-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
	}
	.rule {
		flex: 1;
		height: 1px;
		background: var(--border-subtle);
	}
	.demo-pw {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}
	.demo-list {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.demo-agent {
		display: flex;
		align-items: center;
		gap: 11px;
		width: 100%;
		text-align: left;
		padding: 9px 11px;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		cursor: pointer;
		color: inherit;
		transition: var(--transition-colors);
	}
	.demo-agent:hover {
		border-color: var(--border-default);
		background: var(--surface-raised);
	}
	.agent-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex: none;
	}
	.agent-user {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
		min-width: 118px;
	}
	.agent-note {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		flex: 1;
	}

	@media (max-width: 860px) {
		.login {
			grid-template-columns: 1fr;
		}
		.brand-panel {
			display: none;
		}
	}
</style>
