import { prisma } from '../lib/prisma';
import { CreateNotificationDTO } from '../dtos/notification.dto';

// [모든 사용자] 읽지 않은 알림 수신
export async function getNotifications(userId: string) {
    return prisma.notification.findMany({
        where: {
            userId: BigInt(userId),
            isRead: false,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

// [모든 사용자] 알림 읽음 처리
export async function readNotification(notificationId: string, userId: string) {
    return prisma.notification.update({
        where: {
            id: BigInt(notificationId),
            userId: BigInt(userId),
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });
}

// [모든 사용자] 알림 읽음 처리(전체)
export async function readAllNotifications(userId: string) {
    const result = await prisma.notification.updateMany({
        where: {
            userId: BigInt(userId),
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });
    return result.count;
}

// [모든 사용자] 알림 찾기
export async function findNotificationById(notificationId: string) {
    return prisma.notification.findUnique({
        where: { id: BigInt(notificationId) },
    });
}

// [모든 사용자] 알림 생성
export async function createNotification(data: CreateNotificationDTO) {
    return prisma.notification.create({
        data: {
            type: data.type,
            content: data.content,
            isRead: false,
            userId: BigInt(data.userId),
            referenceId: data.referenceId ? BigInt(data.referenceId) : undefined,
        },
    });
}

export async function createManyNotification(notifications: CreateNotificationDTO[]) {
    return prisma.$transaction(
        notifications.map((data) =>
            prisma.notification.create({
                data: {
                    type: data.type,
                    content: data.content,
                    isRead: false,
                    userId: BigInt(data.userId),
                    referenceId: data.referenceId ? BigInt(data.referenceId) : undefined,
                },
            }),
        ),
    );
}
