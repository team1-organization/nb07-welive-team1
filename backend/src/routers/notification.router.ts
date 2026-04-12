import { Router } from 'express';
import { withAsync } from '../lib/withAsync';
import passport from '../lib/passport';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

router.use(passport.authenticate('accessToken', { session: false, failWithError: true }));

// [모든 사용자] 읽지 않은 알림 목록 수신
router.get('/sse', withAsync(notificationController.getNotifications));
// [모든 사용자] 알림 읽음 전체 처리
router.patch('/read-all', withAsync(notificationController.readAllNotifications));
// [모든 사용자] 알림 읽음 처리(단건)
router.patch('/:notificationId/read', withAsync(notificationController.readNotification));

export default router;
