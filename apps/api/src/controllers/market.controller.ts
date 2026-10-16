import { Response } from 'express';
import { marketService } from '../services/market.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class MarketController {
  async getQuotes(_req: unknown, res: Response): Promise<void> {
    try {
      const data = await marketService.getQuotes();
      sendSuccess(res, data, 'Market quotes retrieved');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch market quotes';
      sendError(res, message, 502, 'MARKET_UPSTREAM_ERROR');
    }
  }
}

export const marketController = new MarketController();
