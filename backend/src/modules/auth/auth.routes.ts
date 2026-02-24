import { Hono } from 'hono'
import bcrypt from 'bcrypt'
import { baseResponse } from '../../lib/response.js'
import { isStrongPassword } from '../../lib/password.js'
import { prisma } from '../../lib/prisma.js'
import { generateToken } from '../../lib/jwt.js'
import { validateBody } from '../../middleware/validate.middleware.js'
import { loginSchema, signupSchema } from './auth.schema.js'

export const authRoutes = new Hono()

authRoutes.post('/signup', validateBody(signupSchema), async (c) => {
    try {
        const body = await c.req.json()
        const { name, email, password, role } = body

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return c.json(
                baseResponse(false, 'Email already exists', null, [
                    'Duplicate email',
                ]),
                409
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
            },
        })

        const token = generateToken(user.id, user.role)

        return c.json(
            baseResponse(true, 'User created successfully', {
                token,
            }),
            201
        )
    } catch (error) {
        console.error('Signup error:', error)
        return c.json(
            baseResponse(false, 'Internal server error', null, [
                'Something went wrong',
            ]),
            500
        )
    }
})

authRoutes.post('/login', validateBody(loginSchema), async (c) => {
    try {
        const { email, password } = c.get('validatedBody')

        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return c.json(
                baseResponse(false, 'Invalid credentials', null, [
                    'Email or password incorrect',
                ]),
                401
            )
        }

        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
            return c.json(
                baseResponse(false, 'Invalid credentials', null, [
                    'Email or password incorrect',
                ]),
                401
            )
        }

        const token = generateToken(user.id, user.role)

        return c.json(
            baseResponse(true, 'Login successful', { token }),
            200
        )
    } catch (e) {
        console.error('error occured at login', e)
        return c.json(
            baseResponse(false, 'Internal server error', null, [
                'Something went wrong',
            ]),
            500
        )
    }
})