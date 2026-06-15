// swagger-ui-dist ships no types; we only use the bundle factory in the browser.
declare module 'swagger-ui-dist/swagger-ui-bundle.js' {
	const SwaggerUIBundle: (config: Record<string, unknown>) => unknown;
	export default SwaggerUIBundle;
}
declare module 'swagger-ui-dist/swagger-ui.css';
