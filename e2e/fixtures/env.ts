/** Central place for environment-derived configuration (with defaults). */
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';
export const WEB_BASE_URL = process.env.WEB_BASE_URL ?? 'http://localhost:5173';
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'insure_demo';
