<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	let { data } = $props();
	const displayName = $derived(data.user?.display_name_en ?? '');

	// Local filter state initialized from server-provided filters.
	let search = $state(data.filters?.search ?? '');
	let kindSel = $state<string[]>(data.filters?.kind ?? []);
	let statusSel = $state<string[]>(data.filters?.status ?? []);

	const statusOptions = [
		'new',
		'draft',
		'quoted',
		'created',
		'paid',
		'payment_declined',
		'payment_pending',
		'submitted'
	];
	const kindOptions = ['lead', 'quotation', 'eapp', 'payment', 'policy'];

	const localeEn = $derived(getLocale() === 'en');
	const title = (_k: string, en: string, th: string) => (localeEn ? en : th);
	const statusLabel = (s: string) => {
		const key = `status.${s}`;
		const fn = (m as unknown as Record<string, () => string>)[key];
		return fn ? fn() : s;
	};
	const kindLabel = (k: string) => {
		const key = `kind.${k}`;
		const fn = (m as unknown as Record<string, () => string>)[key];
		return fn ? fn() : k;
	};

	function toggle(arr: string[], v: string): string[] {
		return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
	}

	function actionHref(kind: string, refId: string, status: string): string {
		switch (kind) {
			case 'lead':
				return `/leads?highlight=${refId}`;
			case 'quotation':
				return `/quotations/${refId}`;
			case 'eapp':
				return `/eapps/${refId}`;
			case 'payment':
			case 'policy':
				return status === 'submitted' ? `/policies/${refId}` : `/eapps/${refId}`;
			default:
				return '#';
		}
	}

	const fmtDate = (iso: string) =>
		new Date(iso).toLocaleString(localeEn ? 'en-GB' : 'th-TH', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});

	const items = $derived(data.tx?.items ?? []);
	const isEmpty = $derived(items.length === 0);
</script>

<svelte:head><title>{m['dashboard.title']()} · {m['app.title']()}</title></svelte:head>

<div data-testid="dashboard-page" class="space-y-6">
	<header class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 data-testid="dashboard-page-title" class="text-2xl font-bold text-slate-900">
				{m['dashboard.welcome']({ name: displayName })}
			</h1>
			<p class="mt-1 text-sm text-slate-600">{m['dashboard.title']()}</p>
		</div>
		<div class="flex gap-2">
			<a
				data-testid="dashboard-new-lead"
				href="/leads/new"
				class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
			>
				{m['dashboard.new_lead']()}
			</a>
			<a
				data-testid="dashboard-new-quotation"
				href="/catalog"
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
			>
				{m['dashboard.new_quotation']()}
			</a>
		</div>
	</header>

	<!-- Filter bar -->
	<form
		data-testid="dashboard-filter-form"
		method="GET"
		action="/"
		class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
	>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<label class="block">
				<span class="mb-1 block text-xs font-medium text-slate-700"
					>{m['dashboard.filter.search']()}</span
				>
				<input
					data-testid="dashboard-filter-search"
					name="search"
					value={search}
					oninput={(e) => (search = e.currentTarget.value)}
					placeholder={m['dashboard.filter.search']()}
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
				/>
			</label>

			<fieldset class="block">
				<legend class="mb-1 block text-xs font-medium text-slate-700">
					{m['dashboard.filter.kind']()}
				</legend>
				<div class="flex flex-wrap gap-2">
					{#each kindOptions as k (k)}
						<label
							class="inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs
								{kindSel.includes(k)
								? 'border-indigo-500 bg-indigo-50 text-indigo-700'
								: 'border-slate-300 text-slate-600'}"
						>
							<input
								type="checkbox"
								name="kind"
								value={k}
								checked={kindSel.includes(k)}
								onchange={() => (kindSel = toggle(kindSel, k))}
								class="hidden"
							/>
							{kindLabel(k)}
						</label>
					{/each}
				</div>
			</fieldset>

			<fieldset class="block">
				<legend class="mb-1 block text-xs font-medium text-slate-700">
					{m['dashboard.filter.status']()}
				</legend>
				<div class="flex flex-wrap gap-2">
					{#each statusOptions as s (s)}
						<label
							class="inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs
								{statusSel.includes(s)
								? 'border-indigo-500 bg-indigo-50 text-indigo-700'
								: 'border-slate-300 text-slate-600'}"
						>
							<input
								type="checkbox"
								name="status"
								value={s}
								checked={statusSel.includes(s)}
								onchange={() => (statusSel = toggle(statusSel, s))}
								class="hidden"
							/>
							{statusLabel(s)}
						</label>
					{/each}
				</div>
			</fieldset>
		</div>
		<div class="mt-4 flex gap-2">
			<button
				data-testid="dashboard-filter-apply"
				type="submit"
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
			>
				{m['dashboard.filter.apply']()}
			</button>
			<a
				data-testid="dashboard-filter-clear"
				href="/"
				class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
			>
				{m['dashboard.filter.clear']()}
			</a>
		</div>
	</form>

	{#if isEmpty}
		<div
			data-testid="dashboard-empty"
			class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"
		>
			<h2 class="text-lg font-semibold text-slate-900">{m['dashboard.empty.title']()}</h2>
			<p class="mt-2 text-sm text-slate-600">{m['dashboard.empty.body']()}</p>
			<a
				data-testid="dashboard-empty-cta"
				href="/catalog"
				class="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
			>
				{m['dashboard.empty.cta']()}
			</a>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
			<table data-testid="dashboard-table" class="w-full text-left text-sm">
				<thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
					<tr>
						<th class="px-4 py-3">{m['dashboard.table.col.kind']()}</th>
						<th class="px-4 py-3">{m['dashboard.table.col.title']()}</th>
						<th class="px-4 py-3">{m['dashboard.table.col.status']()}</th>
						<th class="px-4 py-3">{m['dashboard.table.col.updated']()}</th>
						<th class="px-4 py-3 text-right">{m['dashboard.table.col.actions']()}</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each items as item (item.id)}
						<tr data-testid="dashboard-row" data-kind={item.kind} data-status={item.status}>
							<td class="px-4 py-3">
								<span
									data-testid="dashboard-row-kind"
									class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
								>
									{kindLabel(item.kind)}
								</span>
							</td>
							<td class="px-4 py-3">
								<div data-testid="dashboard-row-title" class="font-medium text-slate-900">
									{title(item.kind, item.title_en, item.title_th)}
								</div>
								<div data-testid="dashboard-row-summary" class="text-xs text-slate-500">
									{title(item.kind, item.summary_en, item.summary_th)}
								</div>
							</td>
							<td class="px-4 py-3">
								<span
									data-testid="dashboard-row-status"
									class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium
									{item.status === 'submitted'
										? 'bg-green-100 text-green-800'
										: item.status === 'paid' || item.status === 'quoted'
											? 'bg-blue-100 text-blue-800'
											: item.status.includes('declined')
												? 'bg-red-100 text-red-800'
												: 'bg-slate-100 text-slate-700'}"
								>
									{statusLabel(item.status)}
								</span>
							</td>
							<td class="px-4 py-3 text-slate-600">
								<time datetime={item.updated_at}>{fmtDate(item.updated_at)}</time>
							</td>
							<td class="px-4 py-3 text-right">
								<a
									data-testid="dashboard-row-action"
									href={actionHref(item.kind, item.reference_id, item.status)}
									class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
								>
									{item.status === 'submitted'
										? m['dashboard.action.view']()
										: m['dashboard.action.continue']()}
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p data-testid="dashboard-count" class="text-center text-xs text-slate-500">
			{m['dashboard.count']({ count: String(data.tx?.total ?? 0) })}
		</p>
	{/if}
</div>
