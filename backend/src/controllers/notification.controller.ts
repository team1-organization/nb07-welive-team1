import { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { commonIdParam } from '../dtos/common.dto';
import * as notificationService from '../services/notification.service';
import { prisma } from '../lib/prisma';
import socket from '../lib/socket';

// [모든 사용자] 읽지 않은 알림 수신
export async function getNotifications(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');

    const { userId } = commonIdParam.pick({ userId: true }).required().parse({
        userId: req.user?.id,
    });

    const notifications = await notificationService.getNotifications(userId);

    res.status(200).json({
        message: '알림 목록을 성공적으로 불러왔습니다.',
        data: notifications,
    });
}
// [모든 사용자] 알림 읽음 처리(단건)
export async function readNotification(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');

    const { notificationId, userId } = commonIdParam.pick({ notificationId: true, userId: true }).required().parse({
        notificationId: req.params.notificationId,
        userId: req.user?.id,
    });
    const result = await notificationService.readNotification(notificationId, userId);
    return res.status(200).send({
        message: '알림을 읽음 처리 했습니다.',
        data: result,
    });
}

// [모든 사용자] 알림 읽음 처리(전체)
export async function readAllNotifications(req: Request, res: Response) {
    const user = req.user;
    if (!user) throw new UnauthorizedError('인증된 사용자가 아닙니다.');
    const { userId } = commonIdParam.pick({ userId: true }).required().parse({
        userId: req.user?.id,
    });
    const result = await notificationService.readAllNotifications(userId);

    return res.status(200).send({
        message: '전체 알림을 읽음 처리 했습니다.',
        data: result,
    });
}
