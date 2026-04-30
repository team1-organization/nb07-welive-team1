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
    startDate: string;
    endDate: string;
    options: { title: string }[];
    boardId: bigint;
}

export interface UpdatePollData {
    title?: string;
    content?: string;
    status?: PollStatus;
    startDate?: string;
    endDate?: string;
    buildingPermission?: number;
}

export interface PollFilterQuery {
    status?: PollStatus;
    buildingPermission?: number;
    searchKeyword?: string;
}
