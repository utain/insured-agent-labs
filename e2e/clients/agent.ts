import { type APIRequestContext } from '@playwright/test';
import { HttpClient } from './base.client';
import { AuthApi } from './auth.client';
import { LeadsApi } from './leads.client';
import { QuotationsApi } from './quotations.client';
import { IllustrationsApi } from './illustrations.client';
import { CatalogApi } from './catalog.client';
import { PackagesApi } from './packages.client';
import { TransactionsApi } from './transactions.client';
import { AdminApi } from './admin.client';
import { Flows } from './flows';
import { DEMO_PASSWORD } from '../fixtures/env';

/**
 * One agent's view of the whole API. Composes a resource client per area over a
 * single token-bound `HttpClient` — the API analog of how `fixtures/pages.ts`
 * composes a Page Object per screen over one `page`.
 *
 *   const q = await agent.quotations.create({ insured });
 *   await agent.quotations.illustrate(q.id, { expect: 409 });
 */
export class AgentApi {
	readonly auth: AuthApi;
	readonly leads: LeadsApi;
	readonly quotations: QuotationsApi;
	readonly illustrations: IllustrationsApi;
	readonly catalog: CatalogApi;
	readonly packages: PackagesApi;
	readonly transactions: TransactionsApi;
	readonly admin: AdminApi;
	readonly flows: Flows;

	constructor(private readonly http: HttpClient) {
		this.auth = new AuthApi(http);
		this.leads = new LeadsApi(http);
		this.quotations = new QuotationsApi(http);
		this.illustrations = new IllustrationsApi(http);
		this.catalog = new CatalogApi(http);
		this.packages = new PackagesApi(http);
		this.transactions = new TransactionsApi(http);
		this.admin = new AdminApi(http);
		this.flows = new Flows(this);
	}

	/** An unauthenticated client (for login, health, and reset). */
	static anonymous(ctx: APIRequestContext): AgentApi {
		return new AgentApi(new HttpClient(ctx));
	}

	/** Log in and return a client bound to that agent's token. */
	static async loginAs(
		ctx: APIRequestContext,
		username: string,
		password: string = DEMO_PASSWORD
	): Promise<AgentApi> {
		const { token } = await AgentApi.anonymous(ctx).auth.login(username, password);
		return new AgentApi(new HttpClient(ctx, token));
	}
}
