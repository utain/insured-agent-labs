<script lang="ts">
	import { onMount } from 'svelte';

	let container: HTMLDivElement;

	onMount(async () => {
		// Swagger UI is browser-only; load it on the client.
		const [{ default: SwaggerUIBundle }] = await Promise.all([
			import('swagger-ui-dist/swagger-ui-bundle.js'),
			import('swagger-ui-dist/swagger-ui.css')
		]);
		SwaggerUIBundle({
			url: '/api/openapi.json',
			domNode: container,
			deepLinking: true,
			persistAuthorization: true
		});
	});
</script>

<svelte:head><title>API Docs — InsureAgentLabs</title></svelte:head>

<div class="swagger-page">
	<div bind:this={container}></div>
</div>

<style>
	.swagger-page {
		background: #fafafa;
		min-height: 100vh;
	}
</style>
