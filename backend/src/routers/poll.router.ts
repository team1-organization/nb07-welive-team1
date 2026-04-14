import { Router } from 'express';
import passport from 'passport';
import { PollController } from '../controllers/poll.controller';

const router = Router();
const controller = new PollController();

router.use(passport.authenticate('accessToken', { session: false }));

router.post('/', controller.createPoll);
router.get('/', controller.getPolls);
router.get('/:pollId', controller.getPollDetail);
router.patch('/:pollId', controller.updatePoll);
router.delete('/:pollId', controller.deletePoll);

export default router;
