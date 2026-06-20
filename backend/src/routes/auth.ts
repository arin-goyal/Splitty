import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dns from 'dns';
import nodemailer from 'nodemailer';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router(); //Create a router (Express way to group routes)
const prisma = new PrismaClient(); //Create Prisma Client (Our DB connection)

// Create a mail transporter dynamically using environment variables
function createMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

// Helper: Sends a registration verification OTP email using HTML template (supports Resend API & SMTP)
async function sendVerificationEmail(email: string, name: string, otp: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;

  const htmlContent = `
    <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #060D10; color: #DBE8E3; padding: 40px 20px; text-align: center; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1.5px solid #0D242E;">
      <h2 style="font-size: 26px; font-weight: bold; color: #00EE87; margin-bottom: 20px; font-style: italic;">Splitty 💸</h2>
      <p style="font-size: 16px; color: #8E9A9D; line-height: 24px; margin-bottom: 30px;">
        Hello <strong>${name}</strong>,<br>
        Thank you for creating an account with Splitty! Please use the 6-digit verification code below to complete your registration.
      </p>
      <div style="display: inline-block; background-color: rgba(0, 238, 135, 0.08); border: 1.5px solid #00EE87; border-radius: 12px; padding: 16px 36px; margin-bottom: 30px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00EE87;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #5A7268; margin-top: 10px; line-height: 18px;">
        This code is valid for 10 minutes. If you did not request this code, please ignore this email.
      </p>
    </div>
  `;

  const subject = `Verify your email for Splitty - ${otp}`;
  const text = `Hello ${name}, your Splitty verification code is: ${otp}. This code is valid for 10 minutes.`;

  // 1. If Resend API key is configured, use the HTTPS API (works on all Railway plans!)
  if (resendKey) {
    const sender = process.env.SMTP_FROM || 'Splitty <onboarding@resend.dev>';
    console.log(`[Email] Sending verification email via Resend API to ${email}...`);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: sender,
          to: email,
          subject,
          text,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Resend] Verification email sent successfully (ID: ${data.id})`);
      return true;
    } catch (error: any) {
      console.error('[Resend] Error sending email via API:', error.message);
      throw error;
    }
  }

  // 2. Fallback to Nodemailer SMTP (blocked on Railway Free/Trial/Hobby plans)
  const transporter = createMailTransporter();
  if (!transporter) {
    console.log('[Email] Missing both RESEND_API_KEY and SMTP credentials. Skipping real email send.');
    return false;
  }

  const sender = process.env.SMTP_FROM || `"Splitty" <${process.env.SMTP_USER}>`;
  console.log(`[SMTP] Sending verification email via SMTP to ${email}...`);

  try {
    await transporter.sendMail({
      from: sender,
      to: email,
      subject,
      text,
      html: htmlContent,
    });
    console.log(`[SMTP] Verification email sent successfully to ${email}`);
    return true;
  } catch (error: any) {
    console.error('[SMTP] Error sending verification email:', error.message);
    throw error;
  }
}

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

    // Always print OTP to the server logs for easy developer access/testing fallback
    console.log(`\n\x1b[33m[EMAIL VERIFICATION] Verification code for ${email} is: ${otp}\x1b[0m\n`);

    // Fire off the email sending in the background so that SMTP network delays/timeouts
    // don't hang the HTTP request or cause client-side connection timeouts (499).
    const hasTransporter = createMailTransporter() !== null;
    if (hasTransporter) {
      sendVerificationEmail(email.trim().toLowerCase(), name.trim(), otp)
        .catch((mailError: any) => {
          console.error('[SMTP] Background email delivery failed:', mailError.message);
        });
    }

    res.status(200).json({ 
      message: hasTransporter 
        ? 'Verification email triggered.' 
        : 'Verification code generated (check server logs).' 
    });
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