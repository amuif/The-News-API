import { Hono } from 'hono'
import { prisma } from '../../lib/prisma.js'
import { baseResponse } from '../../lib/response.js'
import { authMiddleware, optionalAuth } from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/role.middleware.js'
import { validateBody } from '../../middleware/validate.middleware.js'
import { createArticleSchema, updateArticleSchema } from './article.schema.js'
import { subSeconds } from 'date-fns'

export const articleRoutes = new Hono()

articleRoutes.get('/', async (c) => {
    const page = Number(c.req.query('page') || 1)
    const size = Number(c.req.query('size') || 10)

    const category = c.req.query('category')
    const author = c.req.query('author')
    const q = c.req.query('q')

    const skip = (page - 1) * size

    const where: any = {
        status: 'Published',
        deletedAt: null,
    }

    if (category) {
        where.category = category
    }

    if (q) {
        where.title = {
            contains: q,
            mode: 'insensitive',
        }
    }

    if (author) {
        where.author = {
            name: {
                contains: author,
                mode: 'insensitive',
            },
        }
    }

    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            skip,
            take: size,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.article.count({ where }),
    ])

    return c.json({
        Success: true,
        Message: 'Public articles retrieved',
        Object: articles,
        PageNumber: page,
        PageSize: size,
        TotalSize: total,
        Errors: null,
    })
})
articleRoutes.post('/', authMiddleware, requireRole('author'), validateBody(createArticleSchema), async (c) => {
    try {

        const { title, content, category, status } = c.get('validatedBody')
        const user = c.get('user')

        const errors: string[] = []

        if (errors.length > 0) {
            return c.json(
                baseResponse(false, 'Validation failed', null, errors),
                400
            )
        }

        const article = await prisma.article.create({
            data: {
                title,
                content,
                category,
                status: status || 'Draft',
                authorId: user.sub,
            },
        })

        return c.json(
            baseResponse(true, 'Article created', article),
            201
        )
    } catch (e) {
        console.error('Error createing article', e)
        return c.json(
            baseResponse(false, 'Internal server error', null, [
                'Something went wrong',
            ]),
            500
        )
    }
})
articleRoutes.get('/me', authMiddleware, requireRole('author'), async (c) => {
    const user = c.get('user')
    const includeDeleted = c.req.query('includeDeleted') === 'true'
    const page = Number(c.req.query('page') || 1)
    const size = Number(c.req.query('size') || 10)

    const skip = (page - 1) * size

    // it's optional I am filtering the deleted articles based on a query 
    const where: any = { authorId: user.sub }

    if (!includeDeleted) {
        where.deletedAt = null
    }

    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            skip,
            take: size,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.article.count({ where }),
    ])

    return c.json({
        Success: true,
        Message: 'Articles retrieved',
        Object: articles,
        PageNumber: page,
        PageSize: size,
        TotalSize: total,
        Errors: null,
    })
})

articleRoutes.put('/:id', authMiddleware, requireRole('author'), validateBody(updateArticleSchema), async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')
    const updates = c.get('validatedBody')
    const { title, content, category, status } = c.get('validatedBody')

    const article = await prisma.article.findUnique({
        where: { id },
    })

    if (!article) {
        return c.json(
            baseResponse(false, 'Article not found', null, null),
            404
        )
    }

    if (article.authorId !== user.sub) {
        return c.json(
            baseResponse(false, 'Forbidden', null, ['Not your article']),
            403
        )
    }

    if (article.deletedAt) {
        return c.json(
            baseResponse(false, 'Cannot modify deleted article', null, null),
            400
        )
    }
    // return early if there is nth to update
    if (Object.keys(updates).length === 0) {
        return c.json(
            baseResponse(false, 'No fields to update', null, ['Provide at least one field to update']),
            400
        )
    }
    const updated = await prisma.article.update({
        where: { id },
        data: {
            title: title ?? article.title,
            content: content ?? article.content,
            category: category ?? article.category,
            status: status ?? article.status,
        },
    })

    return c.json(
        baseResponse(true, 'Article updated', updated),
        200
    )
})
articleRoutes.delete('/:id', authMiddleware, requireRole('author'), async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')

    const article = await prisma.article.findUnique({
        where: { id },
    })

    if (!article) {
        return c.json(
            baseResponse(false, 'Article not found', null, null),
            404
        )
    }

    if (article.authorId !== user.sub) {
        return c.json(
            baseResponse(false, 'Forbidden', null, ['Not your article']),
            403
        )
    }

    await prisma.article.update({
        where: { id },
        data: { deletedAt: new Date() },
    })

    return c.json(
        baseResponse(true, 'Article soft deleted', null),
        200
    )
})

// Before creating a ReadLog entry:

//      Check if this user has already read this article in the last 30 seconds.

//       If yes → skip logging

//       If no → create ReadLog
// This prevents refresh spam but still allows real engagement.

articleRoutes.get('/:id', optionalAuth, async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!article || article.deletedAt) {
    return c.json(
      baseResponse(false, 'News article no longer available', null, null),
      404
    )
  }

  if (article.status !== 'Published') {
    return c.json(
      baseResponse(false, 'News article not available', null, null),
      404
    )
  }

  c.executionCtx.waitUntil(
    (async () => {
      try {
        if (!user?.sub) return

        const thirtySecondsAgo = subSeconds(new Date(), 30)

        const recentRead = await prisma.readLog.count({
          where: {
            articleId: article.id,
            readerId: user.sub,
            readAt: {
              gte: thirtySecondsAgo,
            },
          },
        })

        if (recentRead === 0) {
          await prisma.readLog.create({
            data: {
              articleId: article.id,
              readerId: user.sub,
            },
          })
        }
      } catch (err) {
        console.error('Failed to log read:', err)
      }
    })()
  )

  return c.json(
    baseResponse(true, 'Article retrieved', article),
    200
  )
})
