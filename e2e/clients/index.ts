/** Barrel for the API Object Model (the API analog of pages/index.ts). */
export { HttpClient, BaseResource, expectError, type RequestOptions } from './base.client';
export { AgentApi } from './agent';
export { Flows } from './flows';
export { AuthApi } from './auth.client';
export { LeadsApi } from './leads.client';
export { QuotationsApi, type InsuredInput, type CoverageInput } from './quotations.client';
export { IllustrationsApi } from './illustrations.client';
export { CatalogApi } from './catalog.client';
export { PackagesApi, type PackageInput } from './packages.client';
export { TransactionsApi } from './transactions.client';
export { AdminApi } from './admin.client';
