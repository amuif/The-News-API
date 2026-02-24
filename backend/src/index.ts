import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { authRoutes } from './modules/auth/auth.routes.js'
import { articleRoutes } from './modules/article/article.routes.js'


const app = new Hono()

app.use(logger())

app.route('/auth',authRoutes)
app.route('/articles',articleRoutes)
app.get('/', (c) => {
  return c.text('Hello Hono!')
})
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
