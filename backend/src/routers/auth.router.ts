import { Router } from 'express';
import { withAsync } from '../lib/withAsync';
import passport from '../lib/passport';
import * as authController from '../controllers/auth.controller';
const router = Router();

// [유저] 회원가입
router.post('/signup', withAsync(authController.registerUser));
// [관리자] 회원가입
router.post('/signup/admin', withAsync(authController.registerAdmin));
// [슈퍼관리자] 회원가입
router.post('/signup/super-admin', withAsync(authController.registerSuperAdmin));
// [모든 사용자] 로그인
router.post('/login', passport.authenticate('local', { session: false, failWithError: true }), withAsync(authController.login));
// [모든 사용자] 로그아웃
router.post('/logout', withAsync(authController.logout));
// [모든 사용자] 토큰 재발급
router.post('/refresh', passport.authenticate('refreshToken', { session: false, failWithError: true }), withAsync(authController.tokenRefresh));
// [슈퍼관리자] 관리자 가입 상태 변경(단건)
router.patch(
    '/admins/:adminId/status',
    passport.authenticate('accessToken', { session: false, failWithError: true }),
    withAsync(authController.updateAdminStatus),
);
// [슈퍼관리자] 관리자 가입 상태 일괄 변경
router.patch(
    '/admins/status',
    passport.authenticate('accessToken', { session: false, failWithError: true }),
    withAsync(authController.updateManyAdminStatus),
);
// [관리자] 주민 가입 상태 변경(단건)
router.patch(
    `/residents/:residentId/status`,
    passport.authenticate('accessToken', { session: false, failWithError: true }),
    withAsync(authController.updateResidentStatus),
);
// [관리자] 주민 가입 상태 일괄 변경
router.patch(
    `/residents/status`,
    passport.authenticate('accessToken', { session: false, failWithError: true }),
    withAsync(authController.updateManyResidentStatus),
);
// [슈퍼관리자] 관리자 정보(아파트 정보) 수정
router.patch(
    `/admins/:adminId`,
    passport.authenticate('accessToken', { session: false, failWithError: true }),
    withAsync(authController.updateAdminInfo),
);
// [슈퍼관리자] 관리자 정보(아파트 정보 포함) 삭제
router.delete(
    `/admins/:adminId`,
    passport.authenticate('accessToken', { session: false, failWithError: true }),
    withAsync(authController.deleteAdmin),
);
// [슈퍼관리자/관리자] 거절 계정 관리(최고 관리자는 관리자 계정을, 관리자는 사용자 계정을 일괄 정리)
router.post(
    `/cleanup`,
    passport.authenticate('accessToken', { session: false, failWithError: true }),
    withAsync(authController.cleanupRejectedUsers),
);

export default router;
