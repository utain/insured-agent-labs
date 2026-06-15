<script lang="ts">
	import PackageForm from '$lib/components/PackageForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>New package · Vesta AgentSured</title></svelte:head>

<div class="page" data-testid="package-new-page">
	<h1 class="v-h1">New package</h1>
	<p class="v-sub" style="margin:4px 0 22px;">Bundle a base plan, coverage defaults, and riders.</p>
	<PackageForm products={data.products} riders={data.riders} {form} submitLabel="Create package" />
</div>

<style>
	.page {
		max-width: 620px;
		margin: 0 auto;
	}
</style>
