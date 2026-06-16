import type { AgentApi } from './agent';
import type { InsuredInput } from './quotations.client';
import type { Modal } from '../schemas';

/**
 * Multi-resource journeys: the reusable building blocks specs lean on, distinct
 * from single-endpoint resource methods. Lives on `agent.flows`.
 */
export class Flows {
	constructor(private readonly agent: AgentApi) {}

	/** insured (or existing lead) → coverage → Sales Illustration. */
	async createIllustration(opts: {
		insured?: Partial<InsuredInput>;
		leadId?: string;
		product: string;
		sumAssured: number;
		term: number;
		modal?: Modal;
		riders?: { code: string; sumAssured: number }[];
	}): Promise<{ quotationId: string; illustrationId: string }> {
		const quotation = await this.agent.quotations.create(
			opts.leadId
				? { lead_id: opts.leadId }
				: {
						insured: {
							full_name: 'Flow Insured',
							dob: '1990-01-01',
							gender: 'male',
							...opts.insured
						}
					}
		);

		await this.agent.quotations.setCoverage(quotation.id, {
			product: opts.product,
			sumAssured: opts.sumAssured,
			term: opts.term,
			modal: opts.modal,
			riders: opts.riders
		});

		const illustration = await this.agent.quotations.illustrate(quotation.id);
		return { quotationId: quotation.id, illustrationId: illustration.id };
	}
}
