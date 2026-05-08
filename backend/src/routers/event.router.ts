import { Router } from 'express';
import * as eventController from '../controllers/event.controller';
import passport from '../lib/passport';
import { withAsync } from '../lib/withAsync';

const router = Router();

router.get('/', passport.authenticate('accessToken', { session: false, failWithError: true }), withAsync(eventController.getEventList));

router.put('/', passport.authenticate('accessToken', { session: false, failWithError: true }), withAsync(eventController.upsertEvent));

router.delete('/:eventId', passport.authenticate('accessToken', { session: false, failWithError: true }), withAsync(eventController.deleteEvent));

export default router;
