import { PollStatus, UserRole } from '../../generated/prisma';

export interface AuthUser {
    id: string;
    role: UserRole;
    apartmentId: string | null;
    residentDong: string | null;
    boardId: {
        POLL: string | null;
    } | null;
}

export interface CreatePollData {
    title: string;
    content: string;
    buildingPermission: number;
    startDate: Date;
    endDate: Date;
    options: string[];
    boardId: bigint;
}

export interface UpdatePollData {
    title?: string;
    content?: string;
    status?: PollStatus;
}

export interface PollFilterQuery {
    status?: PollStatus;
    buildingPermission?: string;
    keyword?: string;
}
