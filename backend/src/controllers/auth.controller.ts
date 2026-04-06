import { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { clearTokenCookies, generateTokens, setTokenCookies } from '../lib/token';
import * as authService from '../services/auth.service';
import { createUserBody, statusSchema, updateAdminBody } from '../dtos/auth.dto';
import { commonIdParam } from '../dtos/common.dto';

// [유저] 회원가입
export async function registerUser(req: Request, res: Response) {
    const data = createUserBody.parse({ ...req.body, role: 'USER' });
    const createdUser = await authService.register(data);
    return res.status(201).json(createdUser);
}

// [관리자] 회원가입
export async function registerAdmin(req: Request, res: Response) {
    const data = createUserBody.parse({ ...req.body, role: 'ADMIN' });
    const createdUser = await authService.register(data);
    return res.status(201).json(createdUser);
}

// [슈퍼관리자] 회원가입
export async function registerSuperAdmin(req: Request, res: Response) {
    const data = createUserBody.parse({ ...req.body, role: 'SUPER_ADMIN' });
    const createdUser = await authService.register(data);
    return res.status(201).json(createdUser);
}
// [모든 사용자] 로그인
export function login(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { accessToken, refreshToken } = authService.login(user.id);
    setTokenCookies(res, accessToken, refreshToken);
    return res.status(200).json({
        accessToken,
        refreshToken,
    });
}

// [모든 사용자] 로그아웃
export function logout(req: Request, res: Response) {
    clearTokenCookies(res);
    return res.status(204).json();
}

// [모든 사용자] 토큰 재발급
export function tokenRefresh(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { accessToken, refreshToken } = generateTokens(user.id);
    setTokenCookies(res, accessToken, refreshToken);
    return res.status(200).json({
        accessToken,
        refreshToken,
    });
}

// [슈퍼관리자] 관리자 가입 상태 변경(단건)
export async function updateAdminStatus(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { adminId, userId } = commonIdParam.pick({ adminId: true, userId: true }).required().parse({
        adminId: req.params.adminId,
        userId: req.user?.id,
    });
    const { status } = statusSchema.parse(req.body);
    const updatedUser = await authService.updateAdminStatus({ adminId, userId, status });
    return res.status(200).json(updatedUser);
}

// [슈퍼관리자] 관리자 가입 상태 일괄 변경
export async function updateManyAdminStatus(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { userId } = commonIdParam.pick({ userId: true }).required().parse({
        userId: req.user?.id,
    });
    const { status } = statusSchema.parse(req.body);
    const result = await authService.updateManyAdminStatus(userId, status);
    return res.status(200).json(result);
}
// [관리자] 주민 가입 상태 변경(단건)
export async function updateResidentStatus(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { residentId, userId } = commonIdParam.pick({ residentId: true, userId: true }).required().parse({
        residentId: req.params.residentId,
        userId: req.user?.id,
    });
    const { status } = statusSchema.parse(req.body);
    const result = await authService.updateResidentStatus(residentId, userId, status);
    return res.status(200).json(result);
}
// [관리자] 주민 가입 상태 일괄 변경
export async function updateManyResidentStatus(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { userId } = commonIdParam.pick({ userId: true }).required().parse({
        userId: req.user?.id,
    });
    const { status } = statusSchema.parse(req.body);
    const result = await authService.updateManyResidentStatus(userId, status);
    return res.status(200).json(result);
}
// [슈퍼관리자] 관리자 정보(아파트 정보 포함) 수정
export async function updateAdminInfo(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { adminId, userId } = commonIdParam.pick({ adminId: true, userId: true }).required().parse({
        adminId: req.params.adminId,
        userId: req.user?.id,
    });

    const data = updateAdminBody.parse(req.body);
    const result = await authService.updateAdminInfo(adminId, userId, data);

    return res.status(200).json(result);
}
// [슈퍼관리자] 관리자 정보(아파트 정보 포함) 삭제
export async function deleteAdmin(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { adminId, userId } = commonIdParam.pick({ adminId: true, userId: true }).required().parse({
        adminId: req.params.adminId,
        userId: req.user?.id,
    });
    const result = await authService.deleteAdmin(adminId, userId);
    return res.status(200).json(result);
}
// [슈퍼관리자/관리자] 거절 계정 관리(최고 관리자는 관리자 계정을, 관리자는 사용자 계정을 일괄 정리)
export async function cleanupRejectedUsers(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { userId } = commonIdParam.pick({ userId: true }).required().parse({
        userId: req.user?.id,
    });
    const result = await authService.cleanupRejectedUsers(userId);
    return res.status(200).json({
        message: '작업이 성공적으로 완료되었습니다',
    });
}
