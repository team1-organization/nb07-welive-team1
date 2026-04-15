import { Router } from 'express';
import { withAsync } from '../lib/withAsync';
import passport from '../lib/passport';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(passport.authenticate('accessToken', { session: false, failWithError: true }));

// [모든 사용자] 개인정보 조회
router.get('/me', withAsync(userController.getMyProfile));
// [모든 사용자] 개인정보 수정
router.patch('/me', withAsync(userController.updateMyProfile));
// [모든 사용자] 비밀번호 변경
router.patch('/password', withAsync(userController.updatePassword));

export default router;
