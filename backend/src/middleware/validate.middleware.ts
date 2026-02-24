import type { Context, Next } from "hono"
import { baseResponse } from "../lib/response.js"
import type { ZodSchema } from "zod" 

export const validateBody =
    (schema: ZodSchema) =>
        async (c: Context, next: Next) => {
            try {
                const body = await c.req.json()
                const result = schema.safeParse(body)

                if (!result.success) {
                    const errors = result.error.errors.map(
                        (e) => `${e.path.join('.')}: ${e.message}`
                    )

                    return c.json(
                        baseResponse(false, 'Validation failed', null, errors),
                        400
                    )
                }

              
                c.set('validatedBody', result.data)

                await next()
            } catch {
                return c.json(
                    baseResponse(false, 'Invalid JSON body', null, ['Malformed request body']),
                    400
                )
            }
        }