import { Request, Response } from 'express';
import * as imageService from '../services/image.service';
import { commonIdParam } from '../dtos/common.dto';
import { UnauthorizedError } from '../errors/UnauthorizedError';

export async function imageUpload(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');

    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: '업로드된 파일이 없습니다.' });
    }
    const { userId } = commonIdParam.pick({ userId: true }).required().parse({
        userId: req.user?.id,
    });

    console.log(`file : ${JSON.stringify(file)}`);
    const imageUrl = await imageService.imageUpload(userId, file);
    return res.status(200).json({
        message: '이미지 업로드 성공',
        imageUrl: imageUrl,
    });
}

export async function imageDelete(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { userId } = commonIdParam.pick({ userId: true }).required().parse({
        userId: req.user?.id,
    });
    await imageService.imageDelete(userId);
    return res.status(200).json({
        message: '이미지 삭제 성공',
    });
}

export async function imageUpdate(req: Request, res: Response) {
    if (!req.user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { userId } = commonIdParam.pick({ userId: true }).required().parse({
        userId: req.user?.id,
    });
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: '수정할 파일이 없습니다' });
    }
    const newImage = await imageService.imageUpdate(userId, file);
    return res.status(200).json({
        message: '이미지 수정 성공',
        imageUrl: newImage,
    });
}
