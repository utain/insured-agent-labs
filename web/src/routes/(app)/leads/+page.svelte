<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { formatDate, statusColors, initials } from '$lib/format';

	let { data } = $props();
</script>

<svelte:head><title>Leads · Vesta AgentSured</title></svelte:head>

<div class="page" data-testid="leads-list-page">
	<div class="head">
		<div>
			<h1 class="v-h1" data-testid="leads-list-page-title">Leads</h1>
			<p class="v-sub" style="margin-top:4px;">{data.leads.length} people in your pipeline</p>
		</div>
		<a href="/leads/new" class="v-btn v-btn-primary" data-testid="leads-new-button">
			<Icon name="plus" size={16} stroke={2.2} />New lead
		</a>
	</div>

	{#if data.leads.length === 0}
		<div class="empty v-card" data-testid="leads-empty-state" role="status">
			<h3>No leads yet</h3>
			<p>Add your first prospect to start building quotations.</p>
			<a href="/leads/new" class="v-btn v-btn-primary">New lead</a>
		</div>
	{:else}
		<div class="v-card table" data-testid="leads-table">
			<div class="thead">
				<span class="c-name">Name</span>
				<span class="c-occ">Occupation</span>
				<span class="c-status">Status</span>
				<span class="c-created">Created</span>
				<span class="c-actions">Actions</span>
			</div>
			{#each data.leads as lead (lead.id)}
				{@const st = statusColors(lead.status)}
				<div class="trow" data-testid="leads-table-row" data-lead-id={lead.id}>
					<a href="/leads/{lead.id}" class="c-name name-link">
						<span class="v-avatar" style="width:34px;height:34px;font-size:var(--text-xs);"
							>{initials(lead.full_name)}</span
						>
						<span class="name">{lead.full_name}</span>
					</a>
					<span class="c-occ occ">{lead.occupation ?? '—'}</span>
					<span class="c-status">
						<span class="v-badge" style="color:{st.fg};background:{st.bg};">{lead.status}</span>
					</span>
					<span class="c-created created" data-num>{formatDate(lead.created_at)}</span>
					<span class="c-actions actions">
						<a href="/leads/{lead.id}" class="v-btn v-btn-secondary v-btn-sm">View</a>
						<a
							href="/quotations/new?leadId={lead.id}"
							class="v-btn v-btn-sm quote-btn"
							data-testid="leads-quote-button">Quote</a
						>
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1080px;
		margin: 0 auto;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 20px;
	}
	.empty {
		text-align: center;
		padding: 64px 24px;
	}
	.empty h3 {
		font-size: var(--text-lg);
		font-weight: 600;
		margin: 0 0 8px;
	}
	.empty p {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin: 0 0 18px;
	}

	.table {
		overflow: hidden;
	}
	.thead,
	.trow {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 20px;
	}
	.thead {
		color: var(--text-tertiary);
		font-size: var(--text-2xs);
		text-transform: uppercase;
		letter-spacing: var(--tracking-caps);
		font-weight: 600;
		border-bottom: 1px solid var(--border-subtle);
	}
	.trow {
		border-top: 1px solid var(--border-subtle);
	}
	.trow:first-of-type {
		border-top: none;
	}
	.c-name {
		flex: 1.5;
		min-width: 0;
	}
	.c-occ {
		flex: 1;
		min-width: 0;
	}
	.c-status {
		width: 104px;
		flex: none;
	}
	.c-created {
		width: 118px;
		flex: none;
	}
	.c-actions {
		width: 150px;
		flex: none;
		text-align: right;
	}

	.name-link {
		display: flex;
		align-items: center;
		gap: 11px;
		text-decoration: none;
		color: inherit;
	}
	.name {
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.occ {
		color: var(--text-secondary);
		font-size: var(--text-sm);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.created {
		color: var(--text-tertiary);
		font-size: var(--text-xs);
	}
	.actions {
		display: flex;
		gap: 7px;
		justify-content: flex-end;
	}
	.quote-btn {
		background: var(--brand-subtle);
		color: var(--brand);
	}
	.quote-btn:hover {
		background: var(--brand-subtle);
		filter: brightness(1.15);
	}

	@media (max-width: 760px) {
		.c-occ,
		.c-created {
			display: none;
		}
	}
</style>
