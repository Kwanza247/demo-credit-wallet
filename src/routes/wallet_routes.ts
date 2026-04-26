import { Router } from 'express';
import { fund, transfer, withdraw, balance } from '../controllers/wallet_controller';
import { authenticate } from '../middlewares/auth_middleware';

const router = Router();

router.use(authenticate);
router.post('/fund', fund);
router.post('/transfer', transfer);
router.post('/withdraw', withdraw);
router.get('/balance', balance);

export default router;