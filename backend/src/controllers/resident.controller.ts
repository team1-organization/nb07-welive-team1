import type { Request, Response } from 'express';
import {
  createOneResidentReqSchema,
  getResidentDetailReqSchema,
  getResidentsReqSchema,
} from '../dtos/resident.dto';
import {
  createOneResident,
  getResidentById,
  getResidents,
} from '../services/resident.service';

// 입주민 목록 조회
export const getResidentsController = async (
  req: Request,
  res: Response,
) => {
  const dto = getResidentsReqSchema.parse({
    user: req.user,
    query: req.query,
  });

  const result = await getResidents({
    apartmentId: dto.user.apartmentId,
    query: dto.query,
  });

  res.status(200).json(result);
};

// 입주민 상세 조회
export const getResidentByIdController = async (
  req: Request,
  res: Response,
) => {
  const dto = getResidentDetailReqSchema.parse({
    user: req.user,
    params: req.params,
  });

  const result = await getResidentById({
    apartmentId: dto.user.apartmentId,
    residentId: dto.params.id,
  });

  res.status(200).json(result);
};

// 입주민 개별 등록
export const createResidentController = async (
  req: Request,
  res: Response,
) => {
  const dto = createOneResidentReqSchema.parse({
    user: req.user,
    body: req.body,
  });

  const result = await createOneResident({
    apartmentId: dto.user.apartmentId,
    body: dto.body,
  });

  res.status(201).json(result);
};