import type { Context, Next } from "hono"
import { baseResponse } from "../lib/response.js"
import { verifyToken } from "../lib/jwt.js"

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      baseResponse(false, 'Unauthorized', null, [
        'Missing or invalid token',
      ]),
      401
    )
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyToken(token) as any
    c.set('user', payload)
    await next()
  } catch {
    return c.json(
      baseResponse(false, 'Unauthorized', null, [
        'Invalid or expired token',
      ]),
      401
    )
  }
}
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      const payload = verifyToken(token) as any
      c.set('user', payload)
    } catch {
      // if they dont have token it means they are guests
    }
  }

  await next()
}