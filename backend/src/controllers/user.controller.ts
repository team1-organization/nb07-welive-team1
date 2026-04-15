import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { getAuthenticatedUser } from '../utils/validation.util';
import { changePasswordBody, updateProfileBody } from '../dtos/auth.dto';

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
