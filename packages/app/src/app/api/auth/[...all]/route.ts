import { toNextJsHandler } from 'better-auth/next-js'

import { getAuth } from '@/lib/auth/server'

type HandlerFn = (request: Request, context: unknown) => Promise<Response> | Response

function createHandler(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') {
	return (request: Request, context: unknown) => {
		const handlers = toNextJsHandler(getAuth()) as Record<string, HandlerFn>
		return handlers[method](request, context)
	}
}

export const GET = createHandler('GET')
export const POST = createHandler('POST')
export const PUT = createHandler('PUT')
export const PATCH = createHandler('PATCH')
export const DELETE = createHandler('DELETE')
