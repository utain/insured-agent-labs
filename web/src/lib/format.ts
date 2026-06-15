// Display helpers shared across pages.
// Colour maps return raw CSS values (Vesta design tokens) for inline `style`.

import type { ScenarioFlag, TransactionKind } from '$lib/schemas';

/** Thai Baht with the ฿ symbol, no decimals — matches the Vesta illustration. */
export function formatBaht(n: number): string {
	return '฿' + Math.round(n).toLocaleString('en-US');
}

export function formatNumber(n: number): string {
	return new Intl.NumberFormat('en-US').format(n);
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
}

/** Two-letter initials for avatar chips. */
export function initials(name: string): string {
	return (
		(name || '')
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
			.toUpperCase() || '?'
	);
}

export type Tone = { fg: string; bg: string };

/** Lead/quotation status pill colours. */
export function statusColors(status: string): Tone {
	const map: Record<string, Tone> = {
		illustrated: { fg: 'var(--brand)', bg: 'var(--brand-subtle)' },
		customer: { fg: 'var(--accent)', bg: 'var(--accent-subtle)' },
		quoted: { fg: 'var(--accent)', bg: 'var(--accent-subtle)' },
		contacted: { fg: 'var(--cyan-300)', bg: 'rgba(84,214,233,0.12)' },
		draft: { fg: 'var(--text-tertiary)', bg: 'var(--surface-overlay)' },
		new: { fg: 'var(--text-secondary)', bg: 'var(--surface-overlay)' }
	};
	return map[status] ?? map.new;
}

/** Activity-feed "kind" pill colours. */
export const KIND_TONES: Record<TransactionKind, Tone> = {
	lead: { fg: 'var(--text-secondary)', bg: 'var(--surface-overlay)' },
	quotation: { fg: 'var(--accent)', bg: 'var(--accent-subtle)' },
	illustration: { fg: 'var(--brand)', bg: 'var(--brand-subtle)' }
};

export type ScenarioMeta = Tone & { label: string; dot: string; note: string };

/** Demo-scenario badge colours + labels. */
export const SCENARIO_COLORS: Record<ScenarioFlag, ScenarioMeta> = {
	standard: {
		label: 'Standard',
		fg: 'var(--up)',
		bg: 'var(--up-subtle)',
		dot: 'var(--up)',
		note: 'Happy path'
	},
	locked: {
		label: 'Locked',
		fg: 'var(--text-secondary)',
		bg: 'var(--surface-overlay)',
		dot: 'var(--navy-400)',
		note: 'Login is locked (423)'
	},
	glitch: {
		label: 'Glitch',
		fg: 'var(--warning)',
		bg: 'var(--warning-subtle)',
		dot: 'var(--warning)',
		note: 'Slow premium calculation'
	},
	bug: {
		label: 'Bug',
		fg: 'var(--ember-400)',
		bg: 'rgba(226,162,60,0.14)',
		dot: 'var(--ember-500)',
		note: 'Premium inflated, dead button'
	},
	error: {
		label: 'Error',
		fg: 'var(--down)',
		bg: 'var(--down-subtle)',
		dot: 'var(--down)',
		note: 'Illustration fails (500)'
	}
};
