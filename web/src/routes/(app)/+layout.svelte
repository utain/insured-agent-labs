<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { SCENARIO_BADGE } from '$lib/format';

	let { data, children } = $props();
	const user = $derived(data.user);

	const nav = [
		{ href: '/', label: 'Dashboard', testid: 'nav-dashboard-link' },
		{ href: '/leads', label: 'Leads', testid: 'nav-leads-link' },
		{ href: '/packages', label: 'Packages', testid: 'nav-packages-link' },
		{ href: '/catalog', label: 'Catalog', testid: 'nav-catalog-link' }
	];

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}

	let resetting = $state(false);
	async function resetData() {
		resetting = true;
		await fetch('/api/admin/reset', { method: 'POST' });
		await invalidateAll();
		resetting = false;
	}
</script>

<div class="min-h-screen bg-slate-50">
	<header data-testid="app-header" class="border-b border-slate-200 bg-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-14 items-center justify-between">
				<div class="flex items-center gap-6">
					<a href="/" class="flex items-center gap-2" data-testid="header-app-title">
						<span
							class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white"
							>IA</span
						>
						<span class="font-bold text-slate-900">InsureAgentLabs</span>
					</a>
					<nav data-testid="app-nav" class="hidden items-center gap-1 md:flex">
						{#each nav as item (item.href)}
							<a
								href={item.href}
								data-testid={item.testid}
								class="rounded-md px-3 py-1.5 text-sm font-medium transition {isActive(item.href)
									? 'bg-indigo-50 text-indigo-700'
									: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}">{item.label}</a
							>
						{/each}
					</nav>
				</div>

				<div class="flex items-center gap-3">
					<a
						href="/quotations/new"
						class="btn-primary hidden sm:inline-flex"
						data-testid="nav-new-quotation">New Quotation</a
					>
					<button
						type="button"
						onclick={resetData}
						disabled={resetting}
						class="btn-ghost text-xs"
						title="Reset all data to the seeded baseline"
						data-testid="reset-data-button">{resetting ? 'Resetting…' : 'Reset'}</button
					>
					{#if user}
						<div class="flex items-center gap-2 border-l border-slate-200 pl-3">
							<div class="text-right">
								<div class="text-sm font-medium text-slate-800" data-testid="header-user-name">
									{user.display_name}
								</div>
								<div class="text-xs text-slate-400">{user.username}</div>
							</div>
							<span
								class="badge {SCENARIO_BADGE[user.scenario_flag].class}"
								data-testid="header-scenario-badge">{SCENARIO_BADGE[user.scenario_flag].label}</span
							>
						</div>
					{/if}
					<form method="POST" action="/logout" use:enhance>
						<button type="submit" class="btn-ghost text-sm" data-testid="header-logout-button"
							>Sign out</button
						>
					</form>
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{@render children()}
	</main>
</div>
