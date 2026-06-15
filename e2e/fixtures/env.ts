/** Central place for environment-derived configuration (with defaults).
 *  The app now serves the UI and the JSON API from the same origin, so a single
 *  BASE_URL covers both. API_BASE_URL / WEB_BASE_URL are kept as overridable
 *  aliases that default to BASE_URL. */
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
export const API_BASE_URL = process.env.API_BASE_URL ?? BASE_URL;
export const WEB_BASE_URL = process.env.WEB_BASE_URL ?? BASE_URL;
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'insure_demo';
