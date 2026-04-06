import type { Request, Response } from 'express';
import {
    createOneResidentReqSchema,
    deleteResidentReqSchema,
    getResidentDetailReqSchema,
    getResidentsReqSchema,
    updateResidentReqSchema,
} from '../dtos/resident.dto';
import { createOneResident, deleteResidentById, getResidentById, getResidents, updateResidentById } from '../services/resident.service';

// 입주민 목록 조회
export const getResidentsController = async (req: Request, res: Response) => {
    const dto = getResidentsReqSchema.parse({
        user: req.user,
        query: req.query,
    });

    const result = await getResidents({
        apartmentId: dto.user.apartmentId,
        query: dto.query,
    });

    return res.status(200).json(result);
};

// 입주민 상세 조회
export const getResidentDetailController = async (req: Request, res: Response) => {
    const dto = getResidentDetailReqSchema.parse({
        user: req.user,
        params: req.params,
    });

    const result = await getResidentById({
        apartmentId: dto.user.apartmentId,
        residentId: dto.params.id,
    });

    return res.status(200).json(result);
};

// 입주민 개별 등록
export const createResidentController = async (req: Request, res: Response) => {
    const dto = createOneResidentReqSchema.parse({
        user: req.user,
        body: req.body,
    });

    const result = await createOneResident({
        apartmentId: dto.user.apartmentId,
        body: dto.body,
    });

    return res.status(201).json(result);
};

// 입주민 정보 수정
export const updateResidentController = async (req: Request, res: Response) => {
    const dto = updateResidentReqSchema.parse({
        user: req.user,
        params: req.params,
        body: req.body,
    });

    const result = await updateResidentById({
        apartmentId: dto.user.apartmentId,
        residentId: dto.params.id,
        body: dto.body,
    });

    return res.status(200).json(result);
};

// 입주민 정보 삭제
export const deleteResidentController = async (req: Request, res: Response) => {
    const dto = deleteResidentReqSchema.parse({
        user: req.user,
        params: req.params,
    });

    const result = await deleteResidentById({
        apartmentId: dto.user.apartmentId,
        residentId: dto.params.id,
    });

    return res.status(200).json(result);
};
