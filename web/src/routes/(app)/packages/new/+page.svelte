<script lang="ts">
	import PackageForm from '$lib/components/PackageForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>New package · InsureAgentLabs</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-6" data-testid="package-new-page">
	<a href="/packages" class="text-sm text-slate-500 hover:underline">← Back to packages</a>
	<h1 class="text-2xl font-bold text-slate-900">New package</h1>
	<PackageForm products={data.products} riders={data.riders} {form} submitLabel="Create package" />
</div>
