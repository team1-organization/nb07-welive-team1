import { Router } from 'express';
import { withAsync } from '../lib/withAsync';
import passport from '../lib/passport';
import * as imageController from '../controllers/image.controller';
import { s3Util } from '../utils/s3.util';

const router = Router();

router.use(passport.authenticate('accessToken', { session: false, failWithError: true }));

// [모든 사용자] 이미지 업로드
router.post('/upload', s3Util.single('image'), withAsync(imageController.imageUpload));

router.delete('/:imageId', withAsync(imageController.imageDelete));

router.patch('/:imageId', s3Util.single('image'), withAsync(imageController.imageUpdate));

export default router;
