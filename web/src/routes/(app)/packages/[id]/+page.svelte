<script lang="ts">
	import PackageForm from '$lib/components/PackageForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Edit {data.pkg.name} · Vesta AgentSured</title></svelte:head>

<div class="page" data-testid="package-edit-page">
	<h1 class="v-h1">Edit package</h1>
	<p class="v-sub" style="margin:4px 0 22px;">Bundle a base plan, coverage defaults, and riders.</p>
	<PackageForm
		products={data.products}
		riders={data.riders}
		pkg={data.pkg}
		{form}
		submitLabel="Save changes"
	/>
</div>

<style>
	.page {
		max-width: 620px;
		margin: 0 auto;
	}
</style>
