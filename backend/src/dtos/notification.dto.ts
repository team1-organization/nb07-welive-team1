import { z } from 'zod';

export const notificationSchema = z.object({
    notificationId: z.string(),
    content: z.string().min(4),
    notificationType: z.string(),
    isChecked: z.boolean().default(false),
    userId: z.string(),
    complaintId: z.string().optional(),
    noticeId: z.string().optional(),
    pollId: z.string().optional(),
    notifiedAt: z.string(),
});

export const sseNotificationResponse = z.object({
    type: z.literal('alarm'),
    data: z.array(notificationSchema),
});

export const createNotificationSchema = z.object({
    type: z.enum(['ADMIN_SIGNUP', 'USER_SIGNUP', 'POLL', 'COMPLAINT', 'NOTICE']),
    content: z.string().min(4),
    referenceId: z.string().min(1).optional(),
    userId: z.string().min(1),
});

export type NotificationDTO = z.infer<typeof notificationSchema>;
export type CreateNotificationDTO = z.infer<typeof createNotificationSchema>;
export type SSENotificationDTO = z.infer<typeof sseNotificationResponse>;
