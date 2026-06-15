import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { buildOpenApiDocument } from '$lib/server/openapi';

export const GET: RequestHandler = () => json(buildOpenApiDocument());
