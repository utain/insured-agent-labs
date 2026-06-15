// Hand-maintained OpenAPI 3.0 document for the QA-facing API surface.
// Served at /api/openapi.json and rendered by Swagger UI at /api-docs.

export function buildOpenApiDocument() {
	const bearer = [{ bearerAuth: [] }, { cookieAuth: [] }];

	const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
	const arrayOf = (name: string) => ({ type: 'array', items: ref(name) });
	const ok = (schema: object, description = 'OK') => ({
		description,
		content: { 'application/json': { schema } }
	});
	const jsonBody = (schema: object) => ({
		required: true,
		content: { 'application/json': { schema } }
	});
	const errorResponses = {
		'401': ok(ref('ErrorEnvelope'), 'Unauthorized'),
		'404': ok(ref('ErrorEnvelope'), 'Not found'),
		'422': ok(ref('ErrorEnvelope'), 'Validation failed')
	};

	return {
		openapi: '3.0.3',
		info: {
			title: 'InsureAgentLabs API',
			version: '2.0.0',
			description:
				'Deterministic QA-automation training API for a life-insurance quotation workflow. ' +
				'Five seeded agents (password `insure_demo`) trigger reproducible behaviours: ' +
				'`agent.standard` (happy path), `agent.locked` (login 423), `agent.glitch` (slow calculate), ' +
				'`agent.bug` (+5% premium), `agent.error` (illustrate 500). Reset state via POST /api/admin/reset.'
		},
		servers: [{ url: '/' }],
		tags: [
			{ name: 'auth' },
			{ name: 'catalog' },
			{ name: 'leads' },
			{ name: 'packages' },
			{ name: 'quotations' },
			{ name: 'illustrations' },
			{ name: 'transactions' },
			{ name: 'admin' }
		],
		components: {
			securitySchemes: {
				bearerAuth: { type: 'http', scheme: 'bearer' },
				cookieAuth: { type: 'apiKey', in: 'cookie', name: 'session' }
			},
			schemas: {
				ErrorEnvelope: {
					type: 'object',
					properties: {
						error: {
							type: 'object',
							properties: {
								code: { type: 'string' },
								message: { type: 'string' },
								fields: {
									type: 'array',
									items: {
										type: 'object',
										properties: { field: { type: 'string' }, message: { type: 'string' } }
									}
								}
							}
						}
					}
				},
				User: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						username: { type: 'string' },
						display_name: { type: 'string' },
						role: { type: 'string', enum: ['agent', 'admin'] },
						scenario_flag: {
							type: 'string',
							enum: ['standard', 'locked', 'glitch', 'bug', 'error']
						}
					}
				},
				LoginRequest: {
					type: 'object',
					required: ['username', 'password'],
					properties: {
						username: { type: 'string', example: 'agent.standard' },
						password: { type: 'string', example: 'insure_demo' }
					}
				},
				LoginResponse: {
					type: 'object',
					properties: { token: { type: 'string' }, user: ref('User') }
				},
				Product: {
					type: 'object',
					properties: {
						code: { type: 'string' },
						name: { type: 'string' },
						description: { type: 'string' },
						min_age: { type: 'integer' },
						max_age: { type: 'integer' },
						min_sum_assured: { type: 'integer' },
						max_sum_assured: { type: 'integer' },
						term_options: { type: 'array', items: { type: 'integer' } }
					}
				},
				Rider: {
					type: 'object',
					properties: {
						code: { type: 'string' },
						rider_type: { type: 'string', enum: ['health', 'ci', 'pa', 'tpd', 'wp'] },
						name: { type: 'string' },
						min_age: { type: 'integer' },
						max_age: { type: 'integer' },
						sum_assured_options: { type: 'array', items: { type: 'integer' } },
						flat_premium: { type: 'number', nullable: true }
					}
				},
				RiderSelection: {
					type: 'object',
					required: ['code', 'sum_assured'],
					properties: { code: { type: 'string' }, sum_assured: { type: 'integer' } }
				},
				Lead: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						full_name: { type: 'string' },
						dob: { type: 'string', example: '1990-05-20' },
						gender: { type: 'string', enum: ['male', 'female', 'other'] },
						occupation: { type: 'string', nullable: true },
						national_id: { type: 'string', nullable: true },
						phone: { type: 'string', nullable: true },
						email: { type: 'string', nullable: true },
						status: { type: 'string', enum: ['new', 'contacted', 'quoted', 'customer'] }
					}
				},
				CreateLeadRequest: {
					type: 'object',
					required: ['full_name', 'dob', 'gender'],
					properties: {
						full_name: { type: 'string' },
						dob: { type: 'string', example: '1990-05-20' },
						gender: { type: 'string', enum: ['male', 'female', 'other'] },
						occupation: { type: 'string', nullable: true },
						national_id: { type: 'string', nullable: true },
						phone: { type: 'string', nullable: true },
						email: { type: 'string', nullable: true }
					}
				},
				Package: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						agent_id: { type: 'string', nullable: true },
						name: { type: 'string' },
						description: { type: 'string' },
						base_product_code: { type: 'string' },
						default_sum_assured: { type: 'integer' },
						term: { type: 'integer' },
						modal: { type: 'string', enum: ['annual', 'semi', 'quarterly', 'monthly'] },
						riders: arrayOf('RiderSelection')
					}
				},
				CreatePackageRequest: {
					type: 'object',
					required: ['name', 'base_product_code', 'default_sum_assured', 'term'],
					properties: {
						name: { type: 'string' },
						description: { type: 'string' },
						base_product_code: { type: 'string', example: 'LIFE_TERM' },
						default_sum_assured: { type: 'integer', example: 1000000 },
						term: { type: 'integer', example: 20 },
						modal: { type: 'string', enum: ['annual', 'semi', 'quarterly', 'monthly'] },
						riders: arrayOf('RiderSelection')
					}
				},
				QuotationCalc: {
					type: 'object',
					properties: {
						base_premium: { type: 'number' },
						rider_premiums: {
							type: 'array',
							items: {
								type: 'object',
								properties: { code: { type: 'string' }, premium: { type: 'number' } }
							}
						},
						total_annual_premium: { type: 'number' },
						modal_premium: { type: 'number' }
					}
				},
				Quotation: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						lead_id: { type: 'string', nullable: true },
						package_code: { type: 'string', nullable: true },
						insured_name: { type: 'string' },
						insured_age: { type: 'integer' },
						insured_gender: { type: 'string', enum: ['male', 'female', 'other'] },
						base_product_code: { type: 'string', nullable: true },
						sum_assured: { type: 'integer' },
						term: { type: 'integer' },
						modal: { type: 'string', enum: ['annual', 'semi', 'quarterly', 'monthly'] },
						riders: arrayOf('RiderSelection'),
						calc: { allOf: [ref('QuotationCalc')], nullable: true },
						status: { type: 'string', enum: ['draft', 'illustrated'] },
						illustration_id: { type: 'string', nullable: true }
					}
				},
				CreateQuotationRequest: {
					type: 'object',
					properties: {
						lead_id: { type: 'string' },
						insured: {
							type: 'object',
							required: ['full_name', 'dob', 'gender'],
							properties: {
								full_name: { type: 'string' },
								dob: { type: 'string', example: '1990-05-20' },
								gender: { type: 'string', enum: ['male', 'female', 'other'] },
								occupation: { type: 'string', nullable: true }
							}
						}
					}
				},
				UpdateQuotationRequest: {
					type: 'object',
					properties: {
						base_product_code: { type: 'string', example: 'LIFE_TERM' },
						apply_package: { type: 'string' },
						sum_assured: { type: 'integer', example: 1000000 },
						term: { type: 'integer', example: 20 },
						modal: { type: 'string', enum: ['annual', 'semi', 'quarterly', 'monthly'] },
						riders: arrayOf('RiderSelection')
					}
				},
				BenefitLine: {
					type: 'object',
					properties: {
						label: { type: 'string' },
						detail: { type: 'string' },
						sum_assured: { type: 'integer', nullable: true },
						premium: { type: 'number', nullable: true }
					}
				},
				SalesIllustration: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						number: { type: 'string', example: 'SI-20260614-AB12' },
						quotation_id: { type: 'string' },
						insured_name: { type: 'string' },
						insured_age: { type: 'integer' },
						product_name: { type: 'string' },
						term: { type: 'integer' },
						modal: { type: 'string' },
						benefits: arrayOf('BenefitLine'),
						calc: ref('QuotationCalc')
					}
				},
				Transaction: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						kind: { type: 'string', enum: ['lead', 'quotation', 'illustration'] },
						reference_id: { type: 'string' },
						title: { type: 'string' },
						summary: { type: 'string' },
						status: { type: 'string' },
						created_at: { type: 'string' },
						updated_at: { type: 'string' }
					}
				},
				TransactionPage: {
					type: 'object',
					properties: {
						items: arrayOf('Transaction'),
						total: { type: 'integer' },
						page: { type: 'integer' },
						page_size: { type: 'integer' }
					}
				}
			}
		},
		security: bearer,
		paths: {
			'/api/auth/login': {
				post: {
					tags: ['auth'],
					security: [],
					summary: 'Log in and receive a session token',
					requestBody: jsonBody(ref('LoginRequest')),
					responses: {
						'200': ok(ref('LoginResponse')),
						'401': ok(ref('ErrorEnvelope'), 'Invalid credentials'),
						'423': ok(ref('ErrorEnvelope'), 'Account locked (agent.locked)')
					}
				}
			},
			'/api/auth/logout': {
				post: {
					tags: ['auth'],
					summary: 'Log out',
					responses: { '204': { description: 'No content' } }
				}
			},
			'/api/auth/me': {
				get: {
					tags: ['auth'],
					summary: 'Current user',
					responses: { '200': ok(ref('User')), ...errorResponses }
				}
			},
			'/api/catalog/products': {
				get: {
					tags: ['catalog'],
					summary: 'List life products',
					responses: { '200': ok(arrayOf('Product')) }
				}
			},
			'/api/catalog/products/{code}': {
				get: {
					tags: ['catalog'],
					summary: 'Get a product',
					parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': ok(ref('Product')), '404': ok(ref('ErrorEnvelope'), 'Not found') }
				}
			},
			'/api/catalog/riders': {
				get: {
					tags: ['catalog'],
					summary: 'List rider plans',
					parameters: [
						{
							name: 'type',
							in: 'query',
							schema: { type: 'string', enum: ['health', 'ci', 'pa', 'tpd', 'wp'] }
						}
					],
					responses: { '200': ok(arrayOf('Rider')) }
				}
			},
			'/api/catalog/riders/{code}': {
				get: {
					tags: ['catalog'],
					summary: 'Get a rider plan',
					parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': ok(ref('Rider')), '404': ok(ref('ErrorEnvelope'), 'Not found') }
				}
			},
			'/api/leads': {
				get: {
					tags: ['leads'],
					summary: 'List leads',
					responses: { '200': ok(arrayOf('Lead')), ...errorResponses }
				},
				post: {
					tags: ['leads'],
					summary: 'Create a lead',
					requestBody: jsonBody(ref('CreateLeadRequest')),
					responses: { '200': ok(ref('Lead')), ...errorResponses }
				}
			},
			'/api/leads/{id}': {
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
				get: {
					tags: ['leads'],
					summary: 'Get a lead',
					responses: { '200': ok(ref('Lead')), ...errorResponses }
				},
				put: {
					tags: ['leads'],
					summary: 'Update a lead',
					requestBody: jsonBody(ref('CreateLeadRequest')),
					responses: { '200': ok(ref('Lead')), ...errorResponses }
				},
				delete: {
					tags: ['leads'],
					summary: 'Delete a lead',
					responses: { '204': { description: 'Deleted' }, ...errorResponses }
				}
			},
			'/api/packages': {
				get: {
					tags: ['packages'],
					summary: 'List packages',
					responses: { '200': ok(arrayOf('Package')), ...errorResponses }
				},
				post: {
					tags: ['packages'],
					summary: 'Create a package',
					requestBody: jsonBody(ref('CreatePackageRequest')),
					responses: { '200': ok(ref('Package')), ...errorResponses }
				}
			},
			'/api/packages/{id}': {
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
				get: {
					tags: ['packages'],
					summary: 'Get a package',
					responses: { '200': ok(ref('Package')), ...errorResponses }
				},
				put: {
					tags: ['packages'],
					summary: 'Update a package',
					requestBody: jsonBody(ref('CreatePackageRequest')),
					responses: { '200': ok(ref('Package')), ...errorResponses }
				},
				delete: {
					tags: ['packages'],
					summary: 'Delete a package',
					responses: { '204': { description: 'Deleted' }, ...errorResponses }
				}
			},
			'/api/quotations': {
				get: {
					tags: ['quotations'],
					summary: 'List quotations',
					responses: { '200': ok(arrayOf('Quotation')), ...errorResponses }
				},
				post: {
					tags: ['quotations'],
					summary: 'Create a quotation (step 1: insured)',
					requestBody: jsonBody(ref('CreateQuotationRequest')),
					responses: { '200': ok(ref('Quotation')), ...errorResponses }
				}
			},
			'/api/quotations/{id}': {
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
				get: {
					tags: ['quotations'],
					summary: 'Get a quotation',
					responses: { '200': ok(ref('Quotation')), ...errorResponses }
				},
				put: {
					tags: ['quotations'],
					summary: 'Update plan/package, riders and coverage (recomputes premium)',
					requestBody: jsonBody(ref('UpdateQuotationRequest')),
					responses: {
						'200': ok(ref('Quotation')),
						'409': ok(ref('ErrorEnvelope'), 'Already finalized'),
						...errorResponses
					}
				}
			},
			'/api/quotations/{id}/calculate': {
				post: {
					tags: ['quotations'],
					summary: 'Preview premium (agent.glitch adds a delay)',
					parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': ok(ref('QuotationCalc')), ...errorResponses }
				}
			},
			'/api/quotations/{id}/illustrate': {
				post: {
					tags: ['quotations'],
					summary: 'Create a Sales Illustration (agent.error returns 500)',
					parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
					responses: {
						'200': ok(ref('SalesIllustration')),
						'409': ok(ref('ErrorEnvelope'), 'Incomplete quotation'),
						'500': ok(ref('ErrorEnvelope'), 'Generation failed (agent.error)'),
						...errorResponses
					}
				}
			},
			'/api/illustrations/{id}': {
				get: {
					tags: ['illustrations'],
					summary: 'Get a Sales Illustration',
					parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
					responses: { '200': ok(ref('SalesIllustration')), ...errorResponses }
				}
			},
			'/api/transactions': {
				get: {
					tags: ['transactions'],
					summary: 'Dashboard activity feed',
					parameters: [
						{
							name: 'kind',
							in: 'query',
							schema: { type: 'string', enum: ['lead', 'quotation', 'illustration'] }
						},
						{ name: 'status', in: 'query', schema: { type: 'string' } },
						{ name: 'search', in: 'query', schema: { type: 'string' } },
						{ name: 'page', in: 'query', schema: { type: 'integer' } },
						{ name: 'page_size', in: 'query', schema: { type: 'integer' } }
					],
					responses: { '200': ok(ref('TransactionPage')), ...errorResponses }
				}
			},
			'/api/admin/reset': {
				post: {
					tags: ['admin'],
					security: [],
					summary: 'Reset to deterministic seed',
					responses: { '200': ok({ type: 'object' }) }
				}
			},
			'/api/admin/debug-state': {
				get: {
					tags: ['admin'],
					security: [],
					summary: 'Entity counts',
					responses: { '200': ok({ type: 'object' }) }
				}
			}
		}
	};
}
