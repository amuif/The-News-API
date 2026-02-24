import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string

export function generateToken(userId: string, role: string) {
  return jwt.sign(
    {
      sub: userId,
      role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET)
}