import { z } from 'zod'

export const signupSchema = z.object({
  name: z
    .string()
    .regex(/^[A-Za-z\s]+$/, 'Name must contain only alphabets and spaces'),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[@$!%*?&]/, 'Must contain special character'),
  role: z.enum(['author', 'reader']),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})