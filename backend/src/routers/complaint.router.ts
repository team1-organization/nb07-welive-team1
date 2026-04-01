import { Router } from 'express';
import passport from 'passport';
import * as complaintController from '../controllers/complaint.controller';

const router = Router();

router.use(passport.authenticate('accessToken', { session: false }));

// 조회 (공통)
router.get('/', complaintController.getComplaintList);
router.get('/:complaintId', complaintController.getComplaintDetail);

// 등록/수정/삭제
router.post('/', complaintController.createComplaint);
router.patch('/:complaintId', complaintController.updateComplaint);
router.delete('/:complaintId', complaintController.deleteComplaint);

// 상태 변경
router.patch('/:complaintId/status', complaintController.updateComplaintStatus);

export default router;
