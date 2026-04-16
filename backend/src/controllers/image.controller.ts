import { Request, Response } from 'express';
import * as imageService from '../services/image.service';

export async function imageUpload(req: Request, res: Response) {
    const user = get;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: '업로드된 파일이 없습니다.' });
    }

    console.log(`file : ${JSON.stringify(file)}`);
    const imageUrl = await imageService.imageUpload(userId, file);
    return res.status(200).json({
        message: '이미지 업로드 성공',
        imageUrl: imageUrl,
    });
}

export async function imageDelete(request: Request, res: Response) {}

export async function imageUpdate(request: Request, res: Response) {}
