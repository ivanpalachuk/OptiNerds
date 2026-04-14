import { SignJWT, jwtVerify } from 'jose';

const TOKEN_EXPIRY = '7d';

export async function signToken(userId: string, email: string, name: string, secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ userId, email, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(key);
}

export async function verifyToken(token: string, secret: string) {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return payload as { userId: string; email: string; name: string };
  } catch {
    return null;
  }
}
