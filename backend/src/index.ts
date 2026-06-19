import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import expenseRoutes from './routes/expenses';
import groupRoutes from './routes/groups';
import groupExpenseRoutes from './routes/group-expenses';
import friendRoutes from './routes/friends';
import budgetsRoutes from './routes/budgets';
import bugsRoutes from './routes/bugs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like native mobile apps, postman, curl)
      if (!origin) return callback(null, true);
      // Disable CORS restrictions in development
      if (process.env.NODE_ENV !== 'production') return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/group-expenses', groupExpenseRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/bugs', bugsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Centralized error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error('✓ Express Caught Error:', err.message);
    if (err.limit || err.received) {
      console.error(`  - Limit: ${err.limit} bytes, Received: ${err.received} bytes`);
    }
    return res.status(err.status || 500).json({
      error: err.message || 'An internal server error occurred.'
    });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});