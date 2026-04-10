import { Router } from 'express';
import passport from 'passport';
import { PollController } from '../controllers/poll.controller';

const router = Router();
const controller = new PollController();

router.use(passport.authenticate('accessToken', { session: false }));

router.post('/:optionId/vote', controller.vote);
router.delete('/:optionId/vote', controller.cancelVote);

export default router;
