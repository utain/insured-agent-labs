// Light/dark theme handling. Dark is the Vesta default. The active theme lives
// on <html data-theme>, bootstrapped before paint by an inline script in app.html
// and persisted to localStorage.

export type Theme = 'dark' | 'light';

const KEY = 'vesta-theme';

export function currentTheme(): Theme {
	if (typeof document === 'undefined') return 'dark';
	return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): void {
	if (typeof document === 'undefined') return;
	document.documentElement.setAttribute('data-theme', theme);
	try {
		localStorage.setItem(KEY, theme);
	} catch {
		/* ignore */
	}
}

export function toggleTheme(): Theme {
	const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
	applyTheme(next);
	return next;
}
