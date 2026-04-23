import { Request, Response } from 'express';
import {
    changePasswordBody,
    getResidentAccountListQuery,
    residentAccountUserIdParam,
    updateProfileBody,
    updateResidentAccountBody,
} from '../dtos/auth.dto';
import * as userService from '../services/user.service';
import { getAuthenticatedUser } from '../utils/validation.util';

export async function getMyProfile(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);

    const profile = await userService.getMyProfile(user.id);
    return res.status(200).send(profile);
}

export async function updateMyProfile(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);

    const data = updateProfileBody.parse(req.body);

    const updatedProfile = await userService.updateMyProfile(user.id, data);

    return res.status(200).send(updatedProfile);
}

export async function updatePassword(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);

    const data = changePasswordBody.parse(req.body);

    const updatedPassword = await userService.updatePassword(user.id, data);

    return res.status(200).send(updatedPassword);
}

// 입주민 계정 신청 목록 조회
export async function getResidentAccountList(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);

    const query = getResidentAccountListQuery.parse(req.query);

    const result = await userService.getResidentAccountList(user.id, query);

    return res.status(200).send(result);
}

// 입주민 계정 수정
export async function updateResidentAccount(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);

    const params = residentAccountUserIdParam.parse(req.params);
    const data = updateResidentAccountBody.parse(req.body);

    const result = await userService.updateResidentAccountById(user.id, params.userId, data);

    return res.status(200).send(result);
}

// 입주민 계정 삭제
export async function deleteResidentAccount(req: Request, res: Response) {
    const user = getAuthenticatedUser(req);

    const params = residentAccountUserIdParam.parse(req.params);

    const result = await userService.deleteResidentAccountById(user.id, params.userId);

    return res.status(200).send(result);
}
