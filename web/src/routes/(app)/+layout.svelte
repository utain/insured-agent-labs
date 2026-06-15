<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { initials, SCENARIO_COLORS } from '$lib/format';
	import { currentTheme, toggleTheme, type Theme } from '$lib/theme';

	let { data, children } = $props();
	const user = $derived(data.user);
	const scenario = $derived(user ? SCENARIO_COLORS[user.scenario_flag] : SCENARIO_COLORS.standard);

	const nav = [
		{ href: '/', label: 'Dashboard', icon: 'dashboard', testid: 'nav-dashboard-link' },
		{ href: '/leads', label: 'Leads', icon: 'users', testid: 'nav-leads-link' },
		{ href: '/packages', label: 'Packages', icon: 'package', testid: 'nav-packages-link' },
		{ href: '/catalog', label: 'Catalog', icon: 'book', testid: 'nav-catalog-link' }
	];

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	const TITLES: { match: (p: string) => boolean; title: string; sub: string }[] = [
		{ match: (p) => p === '/', title: 'Dashboard', sub: 'Your pipeline at a glance' },
		{ match: (p) => p === '/leads/new', title: 'New lead', sub: 'Capture a prospect' },
		{ match: (p) => p.startsWith('/leads'), title: 'Leads', sub: 'Your book of business' },
		{ match: (p) => p.startsWith('/packages'), title: 'Packages', sub: 'Reusable plan bundles' },
		{ match: (p) => p.startsWith('/catalog'), title: 'Catalog', sub: 'Products & riders' },
		{ match: (p) => p === '/quotations/new', title: 'New quotation', sub: 'Step 1 — Insured' },
		{ match: (p) => p.startsWith('/quotations'), title: 'Build quotation', sub: 'Plan & coverage' },
		{
			match: (p) => p.startsWith('/illustrations'),
			title: 'Sales illustration',
			sub: 'Printable summary'
		}
	];
	const heading = $derived(
		TITLES.find((t) => t.match(page.url.pathname)) ?? { title: 'Vesta AgentSured', sub: '' }
	);

	let navOpen = $state(false);
	let collapsed = $state(false);
	let theme = $state<Theme>('dark');
	onMount(() => {
		theme = currentTheme();
	});
	$effect(() => {
		// close the mobile drawer whenever the route changes
		if (page.url.pathname) navOpen = false;
	});

	let resetting = $state(false);
	async function resetData() {
		resetting = true;
		await fetch('/api/admin/reset', { method: 'POST' });
		await invalidateAll();
		resetting = false;
	}
</script>

<div data-shell class:collapsed>
	<!-- Sidebar -->
	<aside class="no-print" data-sidebar data-open={navOpen}>
		<div class="brand">
			<img src="/vesta-mark.svg" width="34" height="34" alt="" />
			<div class="brand-text" data-srail-label>
				<span class="brand-name">Vesta AgentSured</span>
				<span class="brand-portal">Agent Portal</span>
			</div>
		</div>

		<a href="/quotations/new" class="v-btn v-btn-primary new-quote" data-testid="nav-new-quotation">
			<Icon name="plus" size={16} stroke={2.2} />
			<span data-srail-label>New quotation</span>
		</a>

		<nav data-testid="app-nav">
			{#each nav as item (item.href)}
				<a
					href={item.href}
					data-testid={item.testid}
					class="nav-link"
					class:active={isActive(item.href)}
					title={item.label}
				>
					<Icon name={item.icon} size={18} />
					<span data-srail-label>{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="sidebar-foot">
			<button
				type="button"
				class="collapse-toggle"
				onclick={() => (collapsed = !collapsed)}
				title={collapsed ? 'Expand' : 'Collapse'}
			>
				<Icon name="chevron-left" size={16} stroke={2} class={collapsed ? 'flip' : ''} />
				<span data-srail-label>Collapse</span>
			</button>

			{#if user}
				<div class="user-card">
					<span class="v-avatar" style="width:34px;height:34px;font-size:var(--text-sm);"
						>{initials(user.display_name)}</span
					>
					<div class="user-meta" data-srail-label>
						<div class="user-name" data-testid="header-user-name">{user.display_name}</div>
						<div class="user-handle">{user.username}</div>
					</div>
					<form method="POST" action="/logout" use:enhance data-srail-hide>
						<button
							type="submit"
							class="logout"
							title="Sign out"
							data-testid="header-logout-button"
						>
							<Icon name="logout" size={17} />
						</button>
					</form>
				</div>
			{/if}
		</div>
	</aside>

	{#if navOpen}
		<button class="nav-backdrop no-print" aria-label="Close menu" onclick={() => (navOpen = false)}
		></button>
	{/if}

	<!-- Main column -->
	<div class="main-col">
		<header class="topbar no-print" data-testid="app-header">
			<button
				type="button"
				class="hamburger"
				onclick={() => (navOpen = true)}
				title="Menu"
				aria-label="Open menu"
			>
				<Icon name="menu" size={18} stroke={2} />
			</button>

			<div class="topbar-title">
				<div class="topbar-h" data-testid="header-app-title">{heading.title}</div>
				<div class="topbar-sub">{heading.sub}</div>
			</div>

			{#if user}
				<div class="scenario-switch">
					<span class="v-eyebrow scenario-word">Scenario</span>
					<span
						class="v-badge"
						data-testid="header-scenario-badge"
						style="color:{scenario.fg};background:{scenario.bg};text-transform:none;"
					>
						<span style="width:6px;height:6px;border-radius:50%;background:{scenario.fg};"></span>
						{scenario.label}
					</span>
				</div>
			{/if}

			<button
				type="button"
				class="v-btn v-btn-secondary topbar-reset"
				onclick={resetData}
				disabled={resetting}
				title="Reset all data to the seeded baseline"
				data-testid="reset-data-button"
			>
				<Icon name="refresh" size={15} stroke={2} spin={resetting} />
				<span class="reset-label">{resetting ? 'Resetting…' : 'Reset'}</span>
			</button>

			<button
				type="button"
				class="icon-btn"
				onclick={() => (theme = toggleTheme())}
				title="Toggle theme"
				aria-label="Toggle theme"
			>
				<Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
			</button>
		</header>

		<main>{@render children()}</main>
	</div>
</div>

<style>
	[data-shell] {
		display: grid;
		grid-template-columns: var(--sidebar-w) 1fr;
		min-height: 100vh;
	}
	[data-shell].collapsed {
		grid-template-columns: var(--sidebar-w-collapsed) 1fr;
	}

	aside {
		position: sticky;
		top: 0;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--surface-sunken);
		border-right: 1px solid var(--border-subtle);
		z-index: 70;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 18px 18px 16px;
	}
	.brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1;
		min-width: 0;
	}
	.brand-name {
		font-size: var(--text-base);
		font-weight: 700;
		letter-spacing: -0.01em;
		white-space: nowrap;
	}
	.brand-portal {
		font-size: 10px;
		letter-spacing: var(--tracking-caps);
		text-transform: uppercase;
		color: var(--text-tertiary);
		margin-top: 4px;
	}

	.new-quote {
		margin: 6px 14px 14px;
		height: var(--control-h-md);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 0 12px;
	}
	.nav-link {
		display: flex;
		align-items: center;
		gap: 11px;
		height: 38px;
		padding: 0 12px;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition: var(--transition-colors);
		white-space: nowrap;
	}
	.nav-link:hover {
		background: var(--surface-overlay);
		color: var(--text-primary);
	}
	.nav-link.active {
		background: var(--brand-subtle);
		color: var(--brand);
	}

	.sidebar-foot {
		margin-top: auto;
		padding: 14px;
	}
	.collapse-toggle {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		height: 34px;
		margin-bottom: 8px;
		padding: 0 12px;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--text-tertiary);
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		font-weight: 600;
		cursor: pointer;
	}
	.collapse-toggle:hover {
		color: var(--text-secondary);
	}
	:global([data-shell].collapsed) .collapse-toggle :global(.flip) {
		transform: rotate(180deg);
	}

	.user-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		border-radius: var(--radius-md);
		background: var(--surface-card);
		box-shadow: var(--ring-inset);
	}
	.user-meta {
		min-width: 0;
		flex: 1;
	}
	.user-name {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.user-handle {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}
	.logout {
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--text-tertiary);
	}
	.logout:hover {
		color: var(--text-primary);
		background: var(--surface-overlay);
	}

	.main-col {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 16px;
		height: var(--topbar-h);
		padding: 0 28px;
		background: color-mix(in srgb, var(--surface-app) 82%, transparent);
		backdrop-filter: blur(var(--blur-md));
		-webkit-backdrop-filter: blur(var(--blur-md));
		border-bottom: 1px solid var(--border-subtle);
	}
	.topbar-title {
		min-width: 0;
		flex: 1;
	}
	.topbar-h {
		font-size: var(--text-md);
		font-weight: 600;
		letter-spacing: -0.01em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.topbar-sub {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}
	.scenario-switch {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 5px 10px 5px 12px;
		border-radius: var(--radius-pill);
		background: var(--surface-card);
		box-shadow: var(--ring-inset);
	}
	.icon-btn {
		width: var(--control-h-md);
		height: var(--control-h-md);
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-raised);
		color: var(--text-secondary);
		cursor: pointer;
		transition: var(--transition-colors);
	}
	.icon-btn:hover {
		color: var(--text-primary);
	}
	.topbar-reset {
		height: var(--control-h-md);
		padding: 0 13px;
		font-weight: 500;
	}

	main {
		flex: 1;
		padding: 28px;
		min-width: 0;
	}

	.hamburger {
		display: none;
	}
	.nav-backdrop {
		display: none;
	}

	/* Collapsed rail (desktop) */
	:global([data-shell].collapsed) [data-srail-label] {
		display: none;
	}
	:global([data-shell].collapsed) .brand,
	:global([data-shell].collapsed) .new-quote,
	:global([data-shell].collapsed) .nav-link,
	:global([data-shell].collapsed) .collapse-toggle,
	:global([data-shell].collapsed) .user-card {
		justify-content: center;
	}
	:global([data-shell].collapsed) .new-quote,
	:global([data-shell].collapsed) .nav-link,
	:global([data-shell].collapsed) .collapse-toggle {
		padding-left: 0;
		padding-right: 0;
	}
	:global([data-shell].collapsed) [data-srail-hide] {
		display: none;
	}

	@media (max-width: 1024px) {
		[data-shell],
		[data-shell].collapsed {
			grid-template-columns: 1fr;
		}
		aside {
			position: fixed;
			top: 0;
			bottom: 0;
			left: -288px;
			height: 100vh;
			width: 268px;
			transition: left 0.26s var(--ease-standard);
		}
		aside[data-open='true'] {
			left: 0;
			box-shadow: var(--shadow-xl);
		}
		.collapse-toggle {
			display: none;
		}
		.hamburger {
			display: inline-flex;
			width: var(--control-h-md);
			height: var(--control-h-md);
			flex: none;
			align-items: center;
			justify-content: center;
			border: 1px solid var(--border-default);
			border-radius: var(--radius-md);
			background: var(--surface-raised);
			color: var(--text-secondary);
			cursor: pointer;
		}
		.nav-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 65;
			border: none;
			background: rgba(3, 7, 12, 0.55);
			-webkit-backdrop-filter: blur(2px);
			backdrop-filter: blur(2px);
		}
		main {
			padding: 20px;
		}
	}

	@media (max-width: 760px) {
		.scenario-switch,
		.reset-label {
			display: none;
		}
		.topbar {
			padding: 0 16px;
			gap: 10px;
		}
		main {
			padding: 16px;
		}
	}

	@media print {
		[data-shell] {
			display: block;
		}
		main {
			padding: 0;
		}
	}
</style>
