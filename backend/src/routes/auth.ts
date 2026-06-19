import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dns from 'dns';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router(); //Create a router (Express way to group routes)
const prisma = new PrismaClient(); //Create Prisma Client (Our DB connection)

// Helper: Checks if the domain has mail exchange (MX) or address (A) records
function checkDomainMX(email: string): Promise<boolean> {
  return new Promise((resolve) => {
    const domain = email.split('@')[1];
    if (!domain) return resolve(false);

    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        // Fallback to checking A records (host IP)
        dns.resolve(domain, 'A', (errA, addressesA) => {
          if (errA || !addressesA || addressesA.length === 0) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      } else {
        resolve(true);
      }
    });
  });
}

// Helper: Enforces password security requirements
function isPasswordSecure(password: string): { valid: boolean; reason?: string } {
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_+\-=\[\]]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character (e.g. @, $, !, %, *).' };
  }
  return { valid: true };
}

interface CachedSignup {
  name: string;
  email: string;
  passwordHash: string;
  otp: string;
  expiresAt: number;
}

// Caches unverified registration payloads temporarily in memory
const signupOtpStore = new Map<string, CachedSignup>();

router.post('/signup/initiate', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Password complexity validation
    const passwordCheck = isPasswordSecure(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.reason });
    }

    // Domain existence validation
    const hasMX = await checkDomainMX(email.trim());
    if (!hasMX) {
      return res.status(400).json({ error: 'Invalid email domain: server does not exist or cannot receive mail.' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedPassword = await hashPassword(password);

    // Save registration payload for 10 minutes
    signupOtpStore.set(email.trim().toLowerCase(), {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashedPassword,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Output OTP prominently to the server logs
    console.log(`\n\x1b[33m[EMAIL VERIFICATION] Verification code for ${email} is: ${otp}\x1b[0m\n`);

    res.status(200).json({ message: 'Verification code sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to initiate signup.' });
  }
});

router.post('/signup/verify', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const cached = signupOtpStore.get(email.trim().toLowerCase());
    if (!cached) {
      return res.status(400).json({ error: 'No active signup session found. Please try again.' });
    }

    if (Date.now() > cached.expiresAt) {
      signupOtpStore.delete(email.trim().toLowerCase());
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (cached.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Create user once OTP matches
    const user = await prisma.user.create({
      data: {
        email: cached.email,
        password: cached.passwordHash,
        name: cached.name,
      },
    });

    signupOtpStore.delete(email.trim().toLowerCase());
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, password, and name are required',
      });
    }

    // Enforce same password security rules on direct signup
    const passwordCheck = isPasswordSecure(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.reason });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordValid = await verifyPassword(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        defaultCurrency: true,
        avatar: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/users/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: email as string,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 10,
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, avatar } = req.body;

    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (avatar !== undefined) updateData.avatar = avatar; // can be null to remove

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        defaultCurrency: true,
        avatar: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;