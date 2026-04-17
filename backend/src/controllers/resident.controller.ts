import type { Request, Response } from 'express';
import {
    createOneResidentReqSchema,
    createResidentFromUserReqSchema,
    deleteResidentReqSchema,
    downloadResidentsFileReqSchema,
    downloadResidentTemplateReqSchema,
    getResidentDetailReqSchema,
    getResidentsReqSchema,
    updateResidentReqSchema,
    uploadResidentsFileReqSchema,
} from '../dtos/resident.dto';
import { BadRequestError } from '../errors/BadRequestError';
import {
    createOneResident,
    createResidentFromUser,
    createResidentsFromFile,
    deleteResidentById,
    downloadResidentsFile,
    downloadResidentTemplate,
    getResidentById,
    getResidents,
    updateResidentById,
} from '../services/resident.service';

// 다운로드 파일명 생성
const getResidentsFileName = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `입주민명부_${year}${month}${date}_${hours}${minutes}${seconds}.csv`;
};

// CSV 다운로드 헤더 설정
const setCsvDownloadHeaders = (res: Response, fileName: string) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="residents.csv"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
};

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

// 입주민 업로드 템플릿 다운로드
export const downloadResidentTemplateController = async (req: Request, res: Response) => {
    downloadResidentTemplateReqSchema.parse({
        user: req.user,
    });

    const result = await downloadResidentTemplate();

    setCsvDownloadHeaders(res, '입주민명부_템플릿.csv');

    return res.status(200).send(result);
};

// 입주민 목록 파일 다운로드
export const downloadResidentsFileController = async (req: Request, res: Response) => {
    const dto = downloadResidentsFileReqSchema.parse({
        user: req.user,
        query: req.query,
    });

    const result = await downloadResidentsFile({
        apartmentId: dto.user.apartmentId,
        query: dto.query,
    });

    setCsvDownloadHeaders(res, getResidentsFileName());

    return res.status(200).send(result);
};

// 파일로부터 입주민 등록
export const uploadResidentsFileController = async (req: Request, res: Response) => {
    const dto = uploadResidentsFileReqSchema.parse({
        user: req.user,
    });

    if (!req.file) {
        throw new BadRequestError('업로드할 파일을 선택해주세요.');
    }

    const result = await createResidentsFromFile({
        apartmentId: dto.user.apartmentId,
        fileBuffer: req.file.buffer,
    });

    return res.status(201).json(result);
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

// 사용자로부터 입주민 생성
export const createResidentFromUserController = async (req: Request, res: Response) => {
    const dto = createResidentFromUserReqSchema.parse({
        user: req.user,
        params: req.params,
    });

    const result = await createResidentFromUser({
        apartmentId: dto.user.apartmentId,
        userId: dto.params.userId,
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
