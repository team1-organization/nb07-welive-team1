import { Request, Response } from 'express';
import { createNoticeBodySchema, getNoticeListQuerySchema, noticeIdParamSchema, updateNoticeBodySchema } from '../dtos/notice.dto';
import * as noticeService from '../services/notice.service';

export const createNotice = async (req: Request, res: Response) => {
    const user = req.user!;
    const body = createNoticeBodySchema.parse(req.body);

    await noticeService.createNotice({ user, body });

    return res.status(201).json({
        message: '정상적으로 등록 처리되었습니다',
    });
};

export const getNoticeList = async (req: Request, res: Response) => {
    const query = getNoticeListQuerySchema.parse(req.query);
    const result = await noticeService.getNoticeList(query);

    return res.status(200).json(result);
};

export const getNoticeDetail = async (req: Request, res: Response) => {
    const { noticeId } = noticeIdParamSchema.parse(req.params);
    const result = await noticeService.getNoticeDetail({ noticeId });

    return res.status(200).json(result);
};

export const updateNotice = async (req: Request, res: Response) => {
    const user = req.user!;
    const { noticeId } = noticeIdParamSchema.parse(req.params);
    const body = updateNoticeBodySchema.parse(req.body);

    const result = await noticeService.updateNotice({
        user,
        noticeId,
        body,
    });

    return res.status(200).json(result);
};

export const deleteNotice = async (req: Request, res: Response) => {
    const user = req.user!;
    const { noticeId } = noticeIdParamSchema.parse(req.params);

    await noticeService.deleteNotice({
        user,
        noticeId,
    });

    return res.status(200).json({
        message: '정상적으로 삭제 처리되었습니다',
    });
};
