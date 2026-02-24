import { Hono } from 'hono'
import bcrypt from 'bcrypt'
import { baseResponse } from '../../lib/response.js'
import { isStrongPassword } from '../../lib/password.js'
import { prisma } from '../../lib/prisma.js'
import { generateToken } from '../../lib/jwt.js'

export const authRoutes = new Hono()

authRoutes.post('/signup', async (c) => {
    try {
        const body = await c.req.json()
        const { name, email, password, role } = body

        // if there is no any of this values from the body we return early
        if (!name || !email || !password || !role) {
            return c.json(
                baseResponse(false, 'Validation failed', null, [
                    'All fields are required',
                ]),
                400
            )
        }

        // regex for the name it shd be only alphabets and spaces
        if (!/^[A-Za-z\s]+$/.test(name)) {
            return c.json(
                baseResponse(false, 'Invalid name', null, [
                    'Name must contain only alphabets and spaces',
                ]),
                400
            )
        }
        // check if hte passowrd is strong and maches the requirments from the docs
        if (!isStrongPassword(password)) {
            return c.json(
                baseResponse(false, 'Weak password', null, [
                    'Password must be strong',
                ]),
                400
            )
        }

        // Role validation
        if (!['author', 'reader'].includes(role)) {
            return c.json(
                baseResponse(false, 'Invalid role', null, [
                    'Role must be author or reader',
                ]),
                400
            )
        }
        // check if there is an already exisiting user and if so return early
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

authRoutes.post('/login', async (c) => {
    try {
        const body = await c.req.json()
        const { email, password } = body

        if (!email || !password) {
            return c.json(
                baseResponse(false, 'Validation failed', null, [
                    'Email and password are required',
                ]),
                400
            )
        }

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