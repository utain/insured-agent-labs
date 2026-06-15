<script lang="ts">
	import { formatDate, statusBadgeClass } from '$lib/format';

	let { data } = $props();
	const user = $derived(data.user);

	const kindHref = (kind: string, refId: string) => {
		switch (kind) {
			case 'lead':
				return `/leads/${refId}`;
			case 'quotation':
				return `/quotations/${refId}`;
			case 'illustration':
				return `/illustrations/${refId}`;
			default:
				return '#';
		}
	};

	const stats = $derived([
		{ label: 'Leads', value: data.stats.leads, href: '/leads' },
		{ label: 'Packages', value: data.stats.packages, href: '/packages' },
		{ label: 'Quotations', value: data.stats.quotations, href: '/quotations/new' },
		{ label: 'Illustrations', value: data.stats.illustrated, href: '/' }
	]);
</script>

<svelte:head><title>Dashboard · InsureAgentLabs</title></svelte:head>

<div data-testid="dashboard-page" class="space-y-8">
	<header class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 data-testid="dashboard-page-title" class="text-2xl font-bold text-slate-900">
				Welcome back, {user?.display_name}
			</h1>
			<p class="mt-1 text-sm text-slate-600">Here's what's happening in your pipeline.</p>
		</div>
		<a href="/quotations/new" class="btn-primary" data-testid="dashboard-new-quotation"
			>Start a quotation</a
		>
	</header>

	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		{#each stats as s (s.label)}
			<a href={s.href} class="card p-5 transition hover:border-indigo-300 hover:shadow">
				<div class="text-3xl font-bold text-slate-900">{s.value}</div>
				<div class="mt-1 text-sm text-slate-500">{s.label}</div>
			</a>
		{/each}
	</div>

	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-slate-900">Recent activity</h2>
			<a href="/leads/new" class="text-sm font-medium text-indigo-600 hover:underline">+ New lead</a
			>
		</div>

		{#if data.recent.length === 0}
			<div data-testid="dashboard-empty" class="card border-dashed p-12 text-center">
				<h3 class="text-lg font-semibold text-slate-900">Nothing here yet</h3>
				<p class="mt-2 text-sm text-slate-600">
					Create a lead or start a quotation to see activity here.
				</p>
				<a href="/quotations/new" class="btn-primary mt-4 inline-flex">Start a quotation</a>
			</div>
		{:else}
			<div class="card overflow-hidden">
				<table data-testid="dashboard-table" class="w-full text-left text-sm">
					<thead class="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
						<tr>
							<th class="px-4 py-3">Type</th>
							<th class="px-4 py-3">Item</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Updated</th>
							<th class="px-4 py-3 text-right">Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each data.recent as item (item.id)}
							<tr data-testid="dashboard-row" data-kind={item.kind} data-status={item.status}>
								<td class="px-4 py-3">
									<span class="badge bg-slate-100 text-slate-600 capitalize">{item.kind}</span>
								</td>
								<td class="px-4 py-3">
									<div class="font-medium text-slate-900">{item.title}</div>
									<div class="text-xs text-slate-500">{item.summary}</div>
								</td>
								<td class="px-4 py-3">
									<span class="badge capitalize {statusBadgeClass(item.status)}">{item.status}</span
									>
								</td>
								<td class="px-4 py-3 text-slate-500">{formatDate(item.updated_at)}</td>
								<td class="px-4 py-3 text-right">
									<a
										href={kindHref(item.kind, item.reference_id)}
										class="btn-secondary px-3 py-1.5 text-xs"
										data-testid="dashboard-row-action">Open</a
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
