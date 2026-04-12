import { default as LocalDateTime } from 'dayjs';
import { safeString } from '../utils/string.util';
import { DATE_FORMAT } from '../dtos/common.dto';

type NotificationType = 'ADMIN_SIGNUP' | 'USER_SIGNUP' | 'POLL' | 'COMPLAINT' | 'NOTICE';

export interface NotificationData {
    id: bigint;
    content: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: bigint;
    referenceId?: bigint | null;
    type: NotificationType;
}

// 2. 생성자 및 변환에 사용할 파라미터 타입
export interface NotificationParam {
    id: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
    referenceId?: string | null;
    type: NotificationType;
}

export class Notification {
    readonly id: string;
    readonly content: string;
    readonly isRead: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly userId: string;
    readonly referenceId?: string | null;
    readonly type: NotificationType;

    constructor(params: NotificationParam) {
        this.id = params.id;
        this.content = params.content;
        this.isRead = params.isRead;
        this.createdAt = params.createdAt;
        this.updatedAt = params.updatedAt;
        this.userId = params.userId;
        this.referenceId = params.referenceId;
        this.type = params.type;
    }
    static fromEntity(data: NotificationData): Notification {
        if (!data) throw new Error('알림 데이터가 없습니다');
        return new Notification({
            id: safeString(data.id),
            content: safeString(data.content),
            isRead: data.isRead,
            userId: safeString(data.userId),
            referenceId: data.referenceId ? safeString(data.referenceId) : undefined,
            createdAt: LocalDateTime(data.createdAt).format(DATE_FORMAT),
            updatedAt: LocalDateTime(data.updatedAt).format(DATE_FORMAT),
            type: data.type,
        });
    }
    static fromEntityList(data: NotificationData[]): Notification[] {
        if (!data || !Array.isArray(data)) return [];
        return data.map((item: NotificationData) => Notification.fromEntity(item));
    }
}
