// Deterministic seed state. Built on startup and on POST /api/admin/reset.
// Ported from backend/src/seed.rs (catalog + scenario users), extended with
// package templates and sample leads for the redesigned product.

import type {
	CatalogProduct,
	CatalogRiderPlan,
	Lead,
	Package,
	RiderType,
	ScenarioFlag,
	Transaction,
	User
} from '$lib/schemas';

export interface Db {
	users: Map<string, User>;
	usersByUsername: Map<string, string>;
	passwords: Map<string, string>; // user id -> password (demo only)
	sessions: Map<string, string>; // token -> user id
	leads: Map<string, Lead>;
	packages: Map<string, Package>;
	quotations: Map<string, import('$lib/schemas').Quotation>;
	illustrations: Map<string, import('$lib/schemas').SalesIllustration>;
	transactions: Transaction[];
	products: CatalogProduct[];
	riders: CatalogRiderPlan[];
}

/** Stable id from a string key so seed ids don't change between runs. */
export function deterministicId(key: string): string {
	let h = 0;
	const s = `${key}:${key.length}`;
	for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
	const hex = (h >>> 0).toString(16).padStart(8, '0');
	return `seed-${key}-${hex}`;
}

const USERS: [string, ScenarioFlag, string][] = [
	['agent.standard', 'standard', 'Standard Agent'],
	['agent.locked', 'locked', 'Locked Agent'],
	['agent.glitch', 'glitch', 'Glitch Agent'],
	['agent.bug', 'bug', 'Buggy Agent'],
	['agent.error', 'error', 'Error Agent']
];

export const DEMO_PASSWORD = 'insure_demo';

function buildProducts(): CatalogProduct[] {
	return [
		{
			code: 'LIFE_TERM',
			name: 'Term Life',
			description: 'Pure protection for a fixed term.',
			min_age: 18,
			max_age: 70,
			min_sum_assured: 100_000,
			max_sum_assured: 10_000_000,
			term_options: [10, 15, 20, 25, 30],
			rate_per_thousand: [
				[18, 2.0],
				[30, 3.5],
				[40, 6.0],
				[50, 10.0],
				[60, 18.0]
			]
		},
		{
			code: 'LIFE_WHOLE',
			name: 'Whole Life',
			description: 'Lifetime coverage with cash value.',
			min_age: 18,
			max_age: 65,
			min_sum_assured: 100_000,
			max_sum_assured: 5_000_000,
			term_options: [99],
			rate_per_thousand: [
				[18, 8.0],
				[30, 12.0],
				[40, 18.0],
				[50, 28.0],
				[60, 42.0]
			]
		},
		{
			code: 'LIFE_ENDOW',
			name: 'Endowment',
			description: 'Savings plus protection, maturing at term end.',
			min_age: 18,
			max_age: 60,
			min_sum_assured: 50_000,
			max_sum_assured: 3_000_000,
			term_options: [10, 15, 20, 25],
			rate_per_thousand: [
				[18, 35.0],
				[30, 45.0],
				[40, 60.0],
				[50, 80.0]
			]
		},
		{
			code: 'LIFE_ULIP',
			name: 'Unit-Linked',
			description: 'Investment-linked life insurance.',
			min_age: 18,
			max_age: 70,
			min_sum_assured: 100_000,
			max_sum_assured: 20_000_000,
			term_options: [10, 15, 20, 25, 30],
			rate_per_thousand: [
				[18, 5.0],
				[30, 7.0],
				[40, 11.0],
				[50, 17.0],
				[60, 26.0]
			]
		}
	];
}

function buildRiders(): CatalogRiderPlan[] {
	const riders: CatalogRiderPlan[] = [];
	// [riderType, code-prefix, benefit blurb, plan display names].
	// Plan codes stay `${prefix}_PLAN_${i}` (1-indexed) — packages & tests rely on them.
	const types: [RiderType, string, string, string[]][] = [
		[
			'health',
			'HEALTH',
			'Inpatient and outpatient medical expense cover',
			[
				'Vesta HealthGuard Essential',
				'Vesta HealthGuard Plus',
				'Aegis Care Select',
				'Aegis Care Premier',
				'Lumen Total Health'
			]
		],
		[
			'ci',
			'CI',
			'Lump-sum payout on diagnosis of a covered critical illness',
			[
				'Vesta CI Shield',
				'Vesta Multi-Pay CI',
				'Aegis CritiCare',
				'Aegis CritiCare Plus',
				'Lumen CI Secure',
				'Lumen CI Perfect'
			]
		],
		[
			'pa',
			'PA',
			'Accidental injury and death benefit, 24/7 worldwide',
			[
				'Vesta Accident Guard',
				'Vesta Accident Extra',
				'Aegis PA Protect',
				'Aegis PA Plus',
				'Lumen SafeStep',
				'Lumen SafeStep Pro'
			]
		],
		[
			'tpd',
			'TPD',
			'Lump sum on total and permanent disability',
			[
				'Vesta TPD Cover',
				'Vesta TPD Cover Plus',
				'Aegis TPD Shield',
				'Aegis TPD Shield Pro',
				'Lumen DisabilityCare'
			]
		],
		[
			'wp',
			'WP',
			'Waives future premiums if the insured becomes disabled',
			[
				'Vesta Premium Waiver',
				'Vesta Premium Waiver Plus',
				'Aegis Payor Protect',
				'Aegis Payor Protect Plus',
				'Lumen Premium Relief'
			]
		]
	];
	for (const [riderType, prefix, benefit, names] of types) {
		names.forEach((planName, idx) => {
			const i = idx + 1;
			riders.push({
				code: `${prefix}_PLAN_${i}`,
				rider_type: riderType,
				name: planName,
				description: `${benefit}.`,
				min_age: 18,
				max_age: 65,
				sum_assured_options: [50_000, 100_000, 200_000, 500_000, 1_000_000],
				flat_premium: riderType === 'wp' ? 500 * i : null,
				rate_per_thousand:
					riderType === 'wp'
						? null
						: [
								[18, 1.0 + 0.2 * i],
								[30, 2.0 + 0.3 * i],
								[40, 3.5 + 0.5 * i],
								[50, 6.0 + 0.8 * i],
								[60, 10.0 + 1.2 * i]
							]
			});
		});
	}
	return riders;
}

function buildPackages(): Package[] {
	const now = new Date().toISOString();
	const tpl = (
		key: string,
		name: string,
		description: string,
		base: string,
		sa: number,
		term: number,
		riders: { code: string; sum_assured: number }[]
	): Package => ({
		id: deterministicId(`pkg-${key}`),
		agent_id: null,
		name,
		description,
		base_product_code: base,
		default_sum_assured: sa,
		term,
		modal: 'annual',
		riders,
		created_at: now,
		updated_at: now
	});
	return [
		tpl(
			'family-protector',
			'Family Protector',
			'Term life with health and critical-illness cover for breadwinners.',
			'LIFE_TERM',
			2_000_000,
			20,
			[
				{ code: 'HEALTH_PLAN_2', sum_assured: 500_000 },
				{ code: 'CI_PLAN_2', sum_assured: 500_000 }
			]
		),
		tpl(
			'health-booster',
			'Health Booster',
			'Whole life base with strong health and accident riders.',
			'LIFE_WHOLE',
			1_000_000,
			99,
			[
				{ code: 'HEALTH_PLAN_4', sum_assured: 1_000_000 },
				{ code: 'PA_PLAN_2', sum_assured: 500_000 }
			]
		),
		tpl(
			'wealth-builder',
			'Wealth Builder',
			'Endowment savings plan with premium-waiver protection.',
			'LIFE_ENDOW',
			1_500_000,
			20,
			[{ code: 'WP_PLAN_2', sum_assured: 0 }]
		)
	];
}

function buildLeads(agentId: string): Lead[] {
	const now = new Date().toISOString();
	const rows: [string, string, Lead['gender'], string, Lead['status']][] = [
		['Somchai Jaidee', '1985-04-12', 'male', 'Software Engineer', 'customer'],
		['Suda Wattana', '1990-09-30', 'female', 'Teacher', 'quoted'],
		['Anan Pho', '1978-01-05', 'male', 'Business Owner', 'contacted'],
		['Malee Srisuk', '1995-12-21', 'female', 'Nurse', 'new']
	];
	return rows.map(([full_name, dob, gender, occupation, status], i) => ({
		id: deterministicId(`lead-${i}`),
		agent_id: agentId,
		full_name,
		dob,
		gender,
		occupation,
		national_id: null,
		phone: null,
		email: null,
		status,
		created_at: now,
		updated_at: now
	}));
}

export function seed(): Db {
	const db: Db = {
		users: new Map(),
		usersByUsername: new Map(),
		passwords: new Map(),
		sessions: new Map(),
		leads: new Map(),
		packages: new Map(),
		quotations: new Map(),
		illustrations: new Map(),
		transactions: [],
		products: buildProducts(),
		riders: buildRiders()
	};

	for (const [username, flag, displayName] of USERS) {
		const id = deterministicId(username);
		const user: User = {
			id,
			username,
			display_name: displayName,
			role: 'agent',
			scenario_flag: flag
		};
		db.users.set(id, user);
		db.usersByUsername.set(username, id);
		db.passwords.set(id, DEMO_PASSWORD);
	}

	for (const pkg of buildPackages()) db.packages.set(pkg.id, pkg);

	const standardId = db.usersByUsername.get('agent.standard')!;
	for (const lead of buildLeads(standardId)) db.leads.set(lead.id, lead);

	return db;
}
