import { baseResponse } from "../lib/response.js"
import type{ Context, Next } from 'hono'

export function requireRole(role: 'author' | 'reader') {
  return async (c: Context, next: Next) => {
    const user = c.get('user')

    if (!user || user.role !== role) {
      return c.json(
        baseResponse(false, 'Forbidden', null, [
          'Access denied',
        ]),
        403
      )
    }

    await next()
  }
}