import { Router } from 'express';
import * as apartmentController from '../controllers/apartment.controller';
import passport from '../lib/passport';
import { withAsync } from '../lib/withAsync';

const router = Router();

// [공개용/회원가입] 아파트 목록 조회
router.get('/public', withAsync(apartmentController.getApartmentsForSignup));
// [공개용/회원가입] 아파트 기본 정보 상세 조회
router.get('/public/:id', withAsync(apartmentController.getApartmentBasicInfo));

// [슈퍼관리자/관리자] 아파트 목록 조회
router.get('/', passport.authenticate('accessToken', { session: false, failWithError: true }), withAsync(apartmentController.getApartmentList));
// [슈퍼관리자/관리자] 아파트 상세 조회
router.get(
    '/:apartmentId',
    passport.authenticate('accessToken', { session: false, failWithError: true }),
    withAsync(apartmentController.getApartmentDetails),
);

export default router;
