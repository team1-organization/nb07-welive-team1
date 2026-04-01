import { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { clearTokenCookies, generateTokens, setTokenCookies } from '../lib/token';
import * as authService from '../services/auth.service';
import { createUserBody, statusSchema } from '../dtos/auth.dto';

export async function registerUser(req: Request, res: Response) {
    const data = createUserBody.parse({ ...req.body, role: 'USER' });
    const createdUser = await authService.register(data);
    return res.status(201).json(createdUser);
}

export async function registerAdmin(req: Request, res: Response) {
    const data = createUserBody.parse({ ...req.body, role: 'ADMIN' });
    const createdUser = await authService.register(data);
    return res.status(201).json(createdUser);
}

export async function registerSuperAdmin(req: Request, res: Response) {
    const data = createUserBody.parse({ ...req.body, role: 'SUPER_ADMIN' });
    const createdUser = await authService.register(data);
    return res.status(201).json(createdUser);
}

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

export function logout(req: Request, res: Response) {
    clearTokenCookies(res);
    return res.status(204).json();
}

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
// export async function updateAdminStatus(req: Request, res: Response) {
//     const user = req.user;
//     if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
//     const { adminId, userId } = commonIdParam.pick({ adminId: true, userId: true }).required().parse({
//         adminId: req.params.adminId,
//         userId: req.user?.id,
//     });
//     const { status } = statusSchema.parse(req.body);
//     const updatedUser = await authService.updateAdminStatus({ adminId, userId, status });
//     return res.status(200).json(updatedUser);
// }
// export function updateManyAdminStatus(req: Request, res: Response) {
//     const user = req.user;
//     if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
// }
// export function updateResidentStatus(req: Request, res: Response) {
//     const user = req.user;
//     if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
//     const { residentId, userId } = commonIdParam.pick({ residentId: true, userId: true }).required().parse({
//         residentId: req.params.residentId,
//         userId: req.user?.id,
//     });
// }
// export function updateManyResidentStatus(req: Request, res: Response) {
//     const user = req.user;
//     if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
// }
// export function updateAdminInfo(req: Request, res: Response) {
//     const user = req.user;
//     if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
//     const { adminId, userId } = commonIdParam.pick({ adminId: true, userId: true }).required().parse({
//         adminId: req.params.adminId,
//         userId: req.user?.id,
//     });
// }
// export async function deleteAdmin(req: Request, res: Response) {
//     const user = req.user;
//     if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
//     const { adminId, userId } = commonIdParam.pick({ adminId: true, userId: true }).required().parse({
//         adminId: req.params.adminId,
//         userId: req.user?.id,
//     });
//     const result = await authService.deleteAdmin(adminId, userId);
//     return res.status(200).json(result);
// }
// export async function cleanupRejectedUsers(req: Request, res: Response) {
//     const user = req.user;
//     if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
//     const { apartmentId, userId } = commonIdParam.pick({ apartmentId: true, userId: true }).required().parse({
//         apartmentId: req.params.apartmentId,
//         userId: req.user?.id,
//     });
//     const result = await authService.cleanupRejectedUsers(apartmentId);
//     return res.status(200).json({
//         message: '작업이 성공적으로 완료되었습니다',
//     });
// }
