import express from 'express';
import { subscribePush, sendTestNotification } from '../controllers/notifications';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Save push subscription for logged-in user
router.post('/subscribe', authenticate, subscribePush);

// Send test notification to current user's subscriptions
router.post('/send-test', authenticate, sendTestNotification);

export default router;
