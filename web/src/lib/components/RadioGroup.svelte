<script lang="ts" generics="T extends string | number">
	type Option = { value: T; label: string; hint?: string };

	let {
		name,
		value = $bindable(),
		options,
		variant = 'pill',
		columns,
		testid,
		onchange
	}: {
		/** Optional form field name — set it for native (non-JS) form submission. */
		name?: string;
		value?: T;
		options: Option[];
		variant?: 'pill' | 'tile';
		/** Fixed column count; defaults to one column per option (pills) or 2 (tiles). */
		columns?: number;
		/** data-testid prefix; each option's label becomes `${testid}-${value}`. */
		testid?: string;
		onchange?: (value: T) => void;
	} = $props();

	const cols = $derived(columns ?? (variant === 'tile' ? 2 : options.length));

	function select(v: T) {
		value = v;
		onchange?.(v);
	}
</script>

<div
	class="grid gap-2"
	style="grid-template-columns: repeat({cols}, minmax(0, 1fr));"
	role="radiogroup"
>
	{#each options as opt (opt.value)}
		<label
			class={variant === 'tile' ? 'radio-tile' : 'radio-pill'}
			data-testid={testid ? `${testid}-${opt.value}` : undefined}
		>
			<input
				class="sr-only"
				type="radio"
				{name}
				value={opt.value}
				checked={value === opt.value}
				onchange={() => select(opt.value)}
			/>
			<span class={variant === 'tile' ? 'text-sm font-semibold text-slate-900' : ''}
				>{opt.label}</span
			>
			{#if opt.hint}<span class="text-xs text-slate-500">{opt.hint}</span>{/if}
		</label>
	{/each}
</div>
