import { default as LocalDateTime } from 'dayjs';
import { safeString } from '../utils/string.util';
import { DATE_FORMAT } from '../dtos/common.dto';
import { EventEmitter } from 'events';
type NotificationType = 'ADMIN_SIGNUP' | 'USER_SIGNUP' | 'POLL' | 'COMPLAINT' | 'NOTICE';

export interface NotificationEventPayload {
    room: string;
    notification: Notification; // 발송할 알림 객체
}
export const NOTIFICATION_EVENTS = { NEW_DATA: 'NEW_NOTIFICATION' } as const;
export const notificationEmitter = new EventEmitter();
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
    notificationId: string;
    content: string;
    notificationType: NotificationType;
    notifiedAt: string;
    isChecked: boolean;
    complaintId?: string | null;
    noticeId?: string | null;
    pollId?: string | null;
}

export class Notification {
    readonly notificationId: string;
    readonly content: string;
    readonly notificationType: NotificationType;
    readonly isChecked: boolean;
    readonly notifiedAt: string;

    readonly complaintId?: string | null;
    readonly noticeId?: string | null;
    readonly pollId?: string | null;

    constructor(params: NotificationParam) {
        this.notificationId = params.notificationId;
        this.content = params.content;
        this.notificationType = params.notificationType;
        this.notifiedAt = params.notifiedAt;
        this.isChecked = params.isChecked;

        this.complaintId = params.complaintId;
        this.noticeId = params.noticeId;
        this.pollId = params.pollId;
    }
    static fromEntity(data: NotificationData): Notification {
        if (!data) throw new Error('알림 데이터가 없습니다');

        const referenceId = data.referenceId ? safeString(data.referenceId) : null;

        return new Notification({
            notificationId: safeString(data.id),
            content: safeString(data.content),
            notificationType: data.type,
            notifiedAt: LocalDateTime(data.createdAt).format(DATE_FORMAT),
            isChecked: data.isRead,
            complaintId: data.type === 'COMPLAINT' ? referenceId : undefined,
            noticeId: data.type === 'NOTICE' ? referenceId : undefined,
            pollId: data.type === 'POLL' ? referenceId : undefined,
        });
    }
    static fromEntityList(data: NotificationData[]): Notification[] {
        if (!data || !Array.isArray(data)) return [];
        return data.map((item: NotificationData) => Notification.fromEntity(item));
    }
}
