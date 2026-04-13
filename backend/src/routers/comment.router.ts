import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import passport from '../lib/passport';
import { withAsync } from '../lib/withAsync';

const router = Router();

router.use(
    passport.authenticate('accessToken', {
        session: false,
        failWithError: true,
    }),
);

router.post('/', withAsync(commentController.createComment));
router.patch('/:commentId', withAsync(commentController.updateComment));
router.delete('/:commentId', withAsync(commentController.deleteComment));

export default router;
