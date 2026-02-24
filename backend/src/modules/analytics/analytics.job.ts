import cron from 'node-cron'
import { prisma } from '../../lib/prisma.js'
import { getGMTDate } from '../../lib/date.js'

export function startAnalyticsJob() {
  // Runs every day at 00:10 GMT
  cron.schedule('10 0 * * *', async () => {
    console.log('Running daily analytics job...')

    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)

    const gmtDate = getGMTDate(yesterday)

    const nextDay = new Date(gmtDate)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)

    // Aggregate reads grouped by article
    const grouped = await prisma.readLog.groupBy({
      by: ['articleId'],
      _count: {
        articleId: true,
      },
      where: {
        readAt: {
          gte: gmtDate,
          lt: nextDay,
        },
      },
    })

    for (const entry of grouped) {
      await prisma.dailyAnalytics.upsert({
        where: {
          articleId_date: {
            articleId: entry.articleId,
            date: gmtDate,
          },
        },
        update: {
          viewCount: entry._count.articleId,
        },
        create: {
          articleId: entry.articleId,
          date: gmtDate,
          viewCount: entry._count.articleId,
        },
      })
    }

    console.log('Analytics job completed.')
  }, {
    timezone: 'UTC'
  })
}