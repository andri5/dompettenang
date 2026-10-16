import { Router } from 'express';
import { budgetController } from '../controllers/budget.controller.js';
import { authMiddleware, validate } from '../middlewares/index.js';
import { createBudgetSchema, updateBudgetSchema } from '../utils/validation.js';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => budgetController.getStatus(req, res));

router.put('/', validate(createBudgetSchema), (req, res) => budgetController.upsert(req, res));

router.patch('/', validate(updateBudgetSchema), (req, res) => budgetController.update(req, res));

router.delete('/:month', (req, res) => budgetController.remove(req, res));

export default router;
