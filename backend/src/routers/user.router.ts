import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import passport from '../lib/passport';
import { withAsync } from '../lib/withAsync';

const router = Router();

router.use(passport.authenticate('accessToken', { session: false, failWithError: true }));

// [모든 사용자] 개인정보 조회
router.get('/me', withAsync(userController.getMyProfile));
// [모든 사용자] 개인정보 수정
router.patch('/me', withAsync(userController.updateMyProfile));
// [모든 사용자] 비밀번호 변경
router.patch('/password', withAsync(userController.updatePassword));

// [관리자] 입주민 계정 신청 목록 조회
router.get('/resident-accounts', withAsync(userController.getResidentAccountList));
// [관리자] 입주민 계정 수정
router.patch('/resident-accounts/:userId', withAsync(userController.updateResidentAccount));
// [관리자] 입주민 계정 삭제
router.delete('/resident-accounts/:userId', withAsync(userController.deleteResidentAccount));

export default router;
