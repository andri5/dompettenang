import { Router } from 'express';
import { marketController } from '../controllers/market.controller.js';
import { authMiddleware } from '../middlewares/index.js';

const router = Router();

router.use(authMiddleware);

/**
 * @route   GET /api/v1/market/quotes
 * @desc    Current USD/IDR rate and Antam gold price (1g)
 * @access  Private
 */
router.get('/quotes', (req, res) => marketController.getQuotes(req, res));

export default router;
