<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	let { data, children } = $props();

	const user = $derived(data.user);
	const displayName = $derived(
		getLocale() === 'th' ? user?.display_name_th : user?.display_name_en
	);

	async function switchLocale(newLocale: 'en' | 'th') {
		const path = localizeHref(page.url.pathname, { locale: newLocale }) as Pathname;
		await goto(resolve(path));
	}
</script>

<div class="min-h-screen bg-slate-50">
	<header data-testid="app-header" class="bg-white border-b border-slate-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-14">
				<div class="flex items-center gap-6">
					<a href="/" class="text-lg font-bold text-slate-900" data-testid="header-app-title">
						{m['app.title']()}
					</a>
					<nav data-testid="app-nav" class="flex items-center gap-4">
						<a
							href="/"
							class="text-sm text-slate-600 hover:text-slate-900"
							data-testid="nav-dashboard-link"
						>
							{m['nav.dashboard']()}
						</a>
						<a
							href="/leads"
							class="text-sm text-slate-600 hover:text-slate-900"
							data-testid="nav-leads-link"
						>
							{m['nav.leads']()}
						</a>
						<a
							href="/catalog"
							class="text-sm text-slate-600 hover:text-slate-900"
							data-testid="nav-catalog-link"
						>
							{m['nav.catalog']()}
						</a>
					</nav>
				</div>
				<div class="flex items-center gap-4">
					<div class="flex items-center gap-2">
						<label for="lang-select" class="sr-only">{m['nav.language']()}</label>
						<select
							id="lang-select"
							data-testid="lang-select"
							value={getLocale()}
							onchange={(e) =>
								switchLocale((e.currentTarget as HTMLSelectElement).value as 'en' | 'th')}
							class="text-sm rounded-md border border-slate-300 px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
						>
							<option value="en" data-testid="lang-option-en">{m['nav.language.en']()}</option>
							<option value="th" data-testid="lang-option-th">{m['nav.language.th']()}</option>
						</select>
					</div>
					<span class="text-sm text-slate-700" data-testid="header-user-name">
						{displayName}
					</span>
					<form method="POST" action="/logout" use:enhance>
						<button
							type="submit"
							data-testid="header-logout-button"
							class="text-sm text-slate-600 hover:text-red-600 transition-colors"
						>
							{m['nav.logout']()}
						</button>
					</form>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>
</div>
