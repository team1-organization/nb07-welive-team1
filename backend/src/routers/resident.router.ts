import { Router } from 'express';
import passport from 'passport';
import {
    createResidentController,
    deleteResidentController,
    getResidentDetailController,
    getResidentsController,
    updateResidentController,
} from '../controllers/resident.controller';
import { withAsync } from '../lib/withAsync';

const residentRouter = Router();

residentRouter.use(passport.authenticate('accessToken', { session: false }));

residentRouter.get('/', withAsync(getResidentsController));
residentRouter.post('/', withAsync(createResidentController));
residentRouter.get('/:id', withAsync(getResidentDetailController));
residentRouter.patch('/:id', withAsync(updateResidentController));
residentRouter.delete('/:id', withAsync(deleteResidentController));

export default residentRouter;
