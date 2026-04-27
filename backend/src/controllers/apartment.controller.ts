import * as apartmentService from '../services/apartment.service';
import { Request, Response } from 'express';
import { getAdminApartmentQuery, getPublicApartmentQuery } from '../dtos/apartment.dto';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { commonIdParam } from '../dtos/common.dto';

export async function getApartmentsForSignup(req: Request, res: Response) {
    const data = getPublicApartmentQuery.parse(req.query);
    const apartment = await apartmentService.getApartmentsForSignup(data);
    return res.status(200).send(apartment);
}

export async function getApartmentBasicInfo(req: Request, res: Response) {
    // const { id: apartmentId } = apartmentIdParam.parse(req.params);
    const { apartmentId } = commonIdParam.pick({ apartmentId: true }).required().parse({
        apartmentId: req.params.id,
    });
    const apartment = await apartmentService.getApartmentBasicInfo(apartmentId);
    return res.status(200).send(apartment);
}

export async function getApartmentList(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { userId } = commonIdParam.pick({ userId: true }).required().parse({
        userId: req.user.id,
    });
    const data = getAdminApartmentQuery.parse(req.query);
    const apartment = await apartmentService.getApartmentList(data, userId);
    return res.status(200).send(apartment);
}

export async function getApartmentDetails(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { apartmentId, userId } = commonIdParam.pick({ apartmentId: true, userId: true }).required().parse({
        apartmentId: req.params.apartmentId,
        userId: req.user.id,
    });
    const apartment = await apartmentService.getApartmentDetails(apartmentId, userId);
    return res.status(200).send(apartment);
}
