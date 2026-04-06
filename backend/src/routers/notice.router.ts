import { Router } from 'express';
import * as noticeController from '../controllers/notice.controller';
import passport from '../lib/passport';
import { withAsync } from '../lib/withAsync';

const router = Router();

router.post('/', passport.authenticate('accessToken', { session: false, failWithError: true }), withAsync(noticeController.createNotice));

router.get('/', passport.authenticate('accessToken', { session: false, failWithError: true }), withAsync(noticeController.getNoticeList));

router.get('/:noticeId', passport.authenticate('accessToken', { session: false, failWithError: true }), withAsync(noticeController.getNoticeDetail));

router.patch('/:noticeId', passport.authenticate('accessToken', { session: false, failWithError: true }), withAsync(noticeController.updateNotice));

router.delete('/:noticeId', passport.authenticate('accessToken', { session: false, failWithError: true }), withAsync(noticeController.deleteNotice));

export default router;
