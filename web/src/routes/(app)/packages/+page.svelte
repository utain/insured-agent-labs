<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import { formatBaht } from '$lib/format';

	let { data } = $props();
</script>

<svelte:head><title>Packages · Vesta AgentSured</title></svelte:head>

<div class="page" data-testid="packages-page">
	<div class="head">
		<div>
			<h1 class="v-h1">Packages</h1>
			<p class="v-sub" style="margin-top:4px;">Reusable plan bundles to speed up quoting.</p>
		</div>
		<a href="/packages/new" class="v-btn v-btn-primary" data-testid="package-new-button">
			<Icon name="plus" size={16} stroke={2.2} />New package
		</a>
	</div>

	<div class="grid">
		{#each data.packages as pkg (pkg.id)}
			<div class="v-card card" data-testid="package-card">
				<div class="card-top">
					<span class="name">{pkg.name}</span>
					{#if pkg.agent_id === null}
						<span class="template">Template</span>
					{/if}
				</div>
				<p class="desc">{pkg.description}</p>
				<div class="meta">
					<span>{pkg.base_product_code}</span>
					<span class="sep">·</span>
					<span data-num>{formatBaht(pkg.default_sum_assured)}</span>
					<span class="sep">·</span>
					<span>{pkg.riders.length} riders</span>
				</div>
				{#if pkg.agent_id !== null}
					<div class="actions">
						<a href="/packages/{pkg.id}" class="v-btn v-btn-secondary v-btn-sm edit">Edit</a>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={pkg.id} />
							<button type="submit" class="v-btn v-btn-sm del" data-testid="package-delete"
								>Delete</button
							>
						</form>
					</div>
				{/if}
			</div>
		{/each}
	</div>
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
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}
	.card {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.card-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
	}
	.name {
		font-size: var(--text-md);
		font-weight: 600;
		color: var(--text-primary);
	}
	.template {
		display: inline-flex;
		padding: 2px 9px;
		border-radius: 999px;
		background: rgba(226, 162, 60, 0.14);
		color: var(--ember-400);
		font-size: var(--text-2xs);
		font-weight: 600;
	}
	.desc {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		margin: 0;
		line-height: 1.5;
		flex: 1;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: var(--text-xs);
		color: var(--text-secondary);
		padding-top: 4px;
	}
	.sep {
		color: var(--text-tertiary);
	}
	.actions {
		display: flex;
		gap: 8px;
		padding-top: 8px;
		border-top: 1px solid var(--border-subtle);
	}
	.edit {
		flex: 1;
	}
	.del {
		background: transparent;
		border: 1px solid var(--border-default);
		color: var(--down);
	}
	.del:hover {
		background: var(--down-subtle);
	}

	@media (max-width: 1024px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 640px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
