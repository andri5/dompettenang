/**
 * ============================================
 * Dompet Tenang API - Main Entry Point
 * ============================================
 * Express.js server initialization and configuration.
 * 
 * @author Dompet Tenang Team
 * @version 1.0.0
 * @see README.md for documentation
 * ============================================
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorMiddleware } from './middlewares/index.js';
import { authRateLimiter, apiRateLimiter } from './middlewares/rateLimit.middleware.js';
import { ensureDefaultCategories } from './services/defaultCategories.service.js';

// Initialize Express application
const app = express();

// ==================== SECURITY MIDDLEWARE ====================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:', 'blob:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.disable('x-powered-by');

// ==================== MIDDLEWARE ====================

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NOTE: uploads are NOT publicly static — use GET /api/v1/uploads/content/:kind/:filename

app.use('/api/v1/auth', authRateLimiter);
app.use('/api/v1', apiRateLimiter);

// ==================== ROUTES ====================

// API v1 routes
app.use('/api/v1', routes);

// API Documentation endpoint (static)
app.get('/api/v1/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    endpoints: {
      authentication: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        logout: 'POST /api/v1/auth/logout',
        refresh: 'POST /api/v1/auth/refresh-token',
      },
      expenses: {
        list: 'GET /api/v1/expenses',
        create: 'POST /api/v1/expenses',
        getOne: 'GET /api/v1/expenses/:id',
        update: 'PUT /api/v1/expenses/:id',
        delete: 'DELETE /api/v1/expenses/:id',
      },
      categories: {
        list: 'GET /api/v1/categories',
        create: 'POST /api/v1/categories',
        update: 'PUT /api/v1/categories/:id',
        delete: 'DELETE /api/v1/categories/:id',
      },
      dashboard: {
        summary: 'GET /api/v1/dashboard/summary',
        breakdown: 'GET /api/v1/dashboard/breakdown',
        trends: 'GET /api/v1/dashboard/trends',
      },
    },
    docs: 'See README.md for detailed endpoint documentation',
  });
});

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Dompet Tenang API — Catat keuanganmu dengan tenang',
    version: '1.0.0',
    docs: '/api/v1/health',
  });
});

// ==================== ERROR HANDLING ====================

// Global error handler
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: {
      code: 'NOT_FOUND',
    },
  });
});

// ==================== SERVER STARTUP ====================

const PORT = config.port;

async function start() {
  try {
    await ensureDefaultCategories();
    console.log('[boot] Default categories ready');
  } catch (err) {
    console.error('[boot] Failed to ensure default categories:', err);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║   🚀 Dompet Tenang API Server                       ║');
    console.log('║   ─────────────────────────────────────────────────   ║');
    console.log(`║   📡 Running on: http://0.0.0.0:${PORT}                ║`);
    console.log(`║   🌍 Environment: ${config.nodeEnv.padEnd(28)}║`);
    console.log('║   📚 API Docs: /api/v1/health                        ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
  });
}

void start();

export default app;
