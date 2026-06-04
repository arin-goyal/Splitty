import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Function 1: hashPassword()
// What it does: Takes a plain password, converts it to an unreadable hash.
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Function 2: verifyPassword()
// What it does: Check if a password matches a hash.
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Function 3: generateToken()
// What it does: Create a JWT token with user's ID inside.
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
}

// Function 4: verifyToken()
// What it does: Read a token and extract the user ID.
export function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    if (typeof decoded === 'object' && 'userId' in decoded) {
      return decoded.userId;
    }
    return null;
  } catch {
    return null;
  }
}