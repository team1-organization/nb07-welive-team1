// [모든 사용자] 읽지 않은 알림 실시간 수신 (SSE)
import { NotFoundError } from '../errors/NotFoundError';
import { safeString } from '../utils/string.util';
import { ForbiddenError } from '../errors/ForbiddenError';
import * as notificationRepository from '../repositories/notification.repository';
import * as authRepository from '../repositories/auth.repository';
import { Notification } from '../types/notification.type';
import { CreateNotificationDTO } from '../dtos/notification.dto';
import socket from '../lib/socket';
import { BadRequestError } from '../errors/BadRequestError';

// [모든 사용자] 읽지 않은 알림 수신
export async function getNotifications(userId: string) {
    const findUser = await authRepository.findUserById(userId);
    if (!findUser) throw new NotFoundError('사용자를 찾을 수 없습니다');
    const notification = await notificationRepository.getNotifications(userId);
    return Notification.fromEntityList(notification);
}

// [모든 사용자] 알림 읽음 처리(단건)
export async function readNotification(notificationId: string, userId: string) {
    const findNotification = await notificationRepository.findNotificationById(notificationId);
    if (!findNotification) throw new NotFoundError('알림을 찾을 수 없습니다.');

    if (safeString(findNotification.userId) !== safeString(userId)) {
        throw new ForbiddenError('본인의 알림만 읽음 처리할 수 있습니다.');
    }

    const notification = await notificationRepository.readNotification(notificationId, userId);
    return Notification.fromEntity(notification);
}

// [모든 사용자] 알림 읽음 처리(전체)
export async function readAllNotifications(userId: string) {
    const findUser = await authRepository.findByUserId(userId);
    if (!findUser) throw new NotFoundError('사용자를 찾을 수 없습니다');

    const notification = await notificationRepository.readAllNotifications(userId);
    return notification;
}

// [모든 사용자] 알림 생성
export async function createNotification(data: CreateNotificationDTO) {
    const findUser = await authRepository.findByUserId(data.userId);
    if (!findUser) throw new NotFoundError('사용자를 찾을 수 없습니다');

    const createdNotification = await notificationRepository.createNotification({
        type: data.type,
        content: data.content,
        referenceId: data.referenceId,
        userId: data.userId,
    });
    const notification = Notification.fromEntity(createdNotification);
    socket.sendNotification(safeString(data.userId), notification);

    return notification;
}

export async function createRoleNotification(data: Omit<CreateNotificationDTO, 'userId'>, apartmentId?: string) {
    let roomName: string = '';
    let role: 'SUPER_ADMIN' | 'ADMIN' | null = null;
    let searchApartmentId: string | undefined = undefined;
    if (data.type === 'ADMIN_SIGNUP') {
        roomName = 'ROLE_SUPER_ADMIN';
        role = 'SUPER_ADMIN';
        searchApartmentId = undefined;
    } else if (data.type === 'USER_SIGNUP') {
        if (!apartmentId) throw new BadRequestError('관리자 대상 알림에는 아파트번호가 필요합니다.');
        roomName = `A:${apartmentId}:ADMIN`;
        role = 'ADMIN';
        searchApartmentId = apartmentId;
    } else {
        return;
    }
    const users = await authRepository.findUsersByRole(role, searchApartmentId);
    if (users.length === 0) {
        console.log(`수신 대상 사용자가 없습니다. (Role: ${role}, AptId: ${searchApartmentId})`);
        return [];
    }

    const notificationPayloads: CreateNotificationDTO[] = users.map((user) => ({
        type: data.type,
        content: data.content,
        referenceId: data.referenceId,
        userId: safeString(user.id),
    }));

    const notifications = await notificationRepository.createManyNotification(notificationPayloads);
    socket.broadcastToRoom(roomName, {
        notificationType: data.type,
        content: data.content,
        isChecked: false,
        notifiedAt: new Date().toISOString(),
        complaintId: (data.type as string) === 'COMPLAINT' ? safeString(data.referenceId) : undefined,
        noticeId: (data.type as string) === 'NOTICE' ? safeString(data.referenceId) : undefined,
        pollId: (data.type as string) === 'POLL' ? safeString(data.referenceId) : undefined,
    });
    return Notification.fromEntityList(notifications);
}
