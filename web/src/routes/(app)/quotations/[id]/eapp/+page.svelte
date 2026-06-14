<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { enhance } from '$app/forms';
</script>

<svelte:head><title>{m['eapp.title']()} · {m['app.title']()}</title></svelte:head>

<div class="max-w-md mx-auto text-center py-12">
	<p class="text-slate-600 mb-4" data-testid="eapp-creating-message">
		{m['common.loading']()}
	</p>
	<form method="POST" use:enhance>
		<button
			type="submit"
			data-testid="eapp-create-button"
			class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>
			{m['eapp.title']()}
		</button>
	</form>
</div>
