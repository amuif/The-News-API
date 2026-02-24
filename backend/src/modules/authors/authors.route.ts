import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { requireRole } from '../../middleware/role.middleware.js'
import { prisma } from '../../lib/prisma.js'

export const authorRoutes = new Hono()

authorRoutes.get(
  '/dashboard',
  authMiddleware,
  requireRole('author'),
  async (c) => {
    const user = c.get('user')

    const page = Number(c.req.query('page') || 1)
    const size = Number(c.req.query('size') || 10)
    const skip = (page - 1) * size

    const articles = await prisma.article.findMany({
      where: {
        authorId: user.sub,
        deletedAt: null,
      },
      skip,
      take: size,
      orderBy: { createdAt: 'desc' },
      include: {
        analytics: true,
      },
    })

    const total = await prisma.article.count({
      where: {
        authorId: user.sub,
        deletedAt: null,
      },
    })

    const formatted = articles.map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt,
      totalViews: a.analytics.reduce(
        (sum, day) => sum + day.viewCount,
        0
      ),
    }))

    return c.json({
      Success: true,
      Message: 'Dashboard data retrieved',
      Object: formatted,
      PageNumber: page,
      PageSize: size,
      TotalSize: total,
      Errors: null,
    })
  }
)