import { prisma } from '../lib/prisma';
import { CreateNotificationDTO } from '../dtos/notification.dto';

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

export async function findNotificationById(notificationId: string) {
    return prisma.notification.findUnique({
        where: { id: BigInt(notificationId) },
    });
}

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
