import { Router } from 'express';
import { createResidentController, getResidentByIdController, getResidentsController } from '../controllers/resident.controller';

const residentRouter = Router();

residentRouter.get('/', getResidentsController);
residentRouter.post('/', createResidentController);
residentRouter.get('/:id', getResidentByIdController);

export default residentRouter;
