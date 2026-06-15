// Display helpers shared across pages.

import type { ScenarioFlag } from '$lib/schemas';

export function formatBaht(n: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'THB',
		maximumFractionDigits: 0
	}).format(n);
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

export const SCENARIO_BADGE: Record<ScenarioFlag, { label: string; class: string }> = {
	standard: { label: 'Standard', class: 'bg-emerald-100 text-emerald-700' },
	locked: { label: 'Locked', class: 'bg-slate-200 text-slate-700' },
	glitch: { label: 'Glitch', class: 'bg-amber-100 text-amber-700' },
	bug: { label: 'Bug', class: 'bg-orange-100 text-orange-700' },
	error: { label: 'Error', class: 'bg-red-100 text-red-700' }
};

export function statusBadgeClass(status: string): string {
	switch (status) {
		case 'illustrated':
		case 'customer':
		case 'created':
			return 'bg-indigo-100 text-indigo-700';
		case 'quoted':
			return 'bg-violet-100 text-violet-700';
		case 'contacted':
			return 'bg-sky-100 text-sky-700';
		case 'draft':
		case 'new':
		default:
			return 'bg-slate-100 text-slate-600';
	}
}
