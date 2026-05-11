import { Router } from 'express';
import passport from 'passport';
import {
    createResidentController,
    createResidentFromUserController,
    deleteResidentController,
    downloadResidentsFileController,
    downloadResidentTemplateController,
    getResidentDetailController,
    getResidentsController,
    updateResidentController,
    uploadResidentsFileController,
} from '../controllers/resident.controller';
import { withAsync } from '../lib/withAsync';
import { csvMulterUtil } from '../utils/multer.util';

const residentRouter = Router();

residentRouter.use(passport.authenticate('accessToken', { session: false }));

residentRouter.get('/', withAsync(getResidentsController));
residentRouter.get('/file/template', withAsync(downloadResidentTemplateController));
residentRouter.post('/from-file', csvMulterUtil.single('file'), withAsync(uploadResidentsFileController));
residentRouter.get('/file', withAsync(downloadResidentsFileController));
residentRouter.post('/from-users/:userId', withAsync(createResidentFromUserController));
residentRouter.post('/', withAsync(createResidentController));
residentRouter.get('/:id', withAsync(getResidentDetailController));
residentRouter.patch('/:id', withAsync(updateResidentController));
residentRouter.delete('/:id', withAsync(deleteResidentController));

export default residentRouter;
