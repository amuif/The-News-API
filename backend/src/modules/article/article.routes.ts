import { Hono } from 'hono'
import { prisma } from '../../lib/prisma.js'
import { baseResponse } from '../../lib/response.js'
import { authMiddleware, optionalAuth } from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/role.middleware.js'

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

articleRoutes.post('/', authMiddleware, requireRole('author'), async (c) => {
    try {
        const body = await c.req.json()
        const { title, content, category, status } = body
        const user = c.get('user')

        const errors: string[] = []
        if (user.role==='reader'){
            errors.push('User must me an author to create an article')
        }
        if (!title || title.length < 1 || title.length > 150) {
            errors.push('Title must be between 1 and 150 characters')
        }

        if (!content || content.length < 50) {
            errors.push('Content must be at least 50 characters')
        }

        if (!category) {
            errors.push('Category is required')
        }

        if (status && !['Draft', 'Published'].includes(status)) {
            errors.push('Invalid status')
        }

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
    } catch(e) {
        console.error('Error createing article',e)
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
articleRoutes.put('/:id', authMiddleware, requireRole('author'), async (c) => {
    const id = c.req.param('id')
    const user = c.get('user')
    const body = await c.req.json()

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

    const updated = await prisma.article.update({
        where: { id },
        data: {
            title: body.title ?? article.title,
            content: body.content ?? article.content,
            category: body.category ?? article.category,
            status: body.status ?? article.status,
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

    prisma.readLog.create({
        data: {
            articleId: article.id,
            readerId: user?.sub ?? null,
        },
    }).catch((err: any) => {
        console.error('Failed to log read:', err)
    })

    return c.json(
        baseResponse(true, 'Article retrieved', article),
        200
    )
})