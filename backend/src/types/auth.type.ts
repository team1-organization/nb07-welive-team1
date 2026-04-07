import { default as LocalDateTime } from 'dayjs';
import { safeString } from '../utils/string.util';
import { DATE_FORMAT } from '../dtos/common.dto';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';
type JoinStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserData {
    id: bigint;
    email: string;
    userId: string;
    name: string;
    contact: string;
    profileImage: string | null;
    role: UserRole;
    isActive: boolean;
    joinStatus: JoinStatus;
    apartmentId?: bigint | null;
    apartment?: {
        id: bigint;
        apartmentName: string;
        board: {
            id: bigint;
            type: 'NOTICE' | 'COMPLAINT' | 'POLL';
        }[];
    } | null;
    resident?: {
        id: bigint;
        building: string;
        unitNumber: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserParam {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    joinStatus: JoinStatus;
    isActive: boolean;
    apartmentId?: string | null;
    apartmentName?: string | null;
    residentDong?: string | null;
    residentHo?: string | null;
    boardIds?: {
        COMPLAINT: string | null;
        NOTICE: string | null;
        POLL: string | null;
    } | null;
    username: string;
    contact: string;
    avatar: string | null;
    createdAt: string;
    updatedAt: string;
}
export class User {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly name: string;
    readonly contact: string;
    readonly avatar: string | null;
    readonly role: UserRole;
    readonly isActive: boolean;
    readonly joinStatus: JoinStatus;

    readonly apartmentId: string | null;
    readonly apartmentName: string | null;
    readonly residentDong: string | null;
    readonly residentHo: string | null;
    readonly boardIds: {
        COMPLAINT: string | null;
        NOTICE: string | null;
        POLL: string | null;
    } | null;

    readonly createdAt: string;
    readonly updatedAt: string;

    constructor(params: UserParam) {
        this.id = params.id;
        this.email = params.email;
        this.username = params.username;
        this.name = params.name;
        this.contact = params.contact;
        this.avatar = params.avatar;
        this.role = params.role;
        this.isActive = params.isActive;
        this.joinStatus = params.joinStatus;

        this.apartmentId = params.apartmentId ?? null;
        this.apartmentName = params.apartmentName ?? null;
        this.residentDong = params.residentDong ?? null;
        this.residentHo = params.residentHo ?? null;
        this.boardIds = params.boardIds ?? null;

        this.createdAt = params.createdAt;
        this.updatedAt = params.updatedAt;
    }
    static fromEntity(data: UserData): User {
        if (!data) throw new Error('데이터가 없습니다');

        const boards = data.apartment?.board || [];
        const findBoardId = (type: 'NOTICE' | 'COMPLAINT' | 'POLL') => {
            const board = boards.find((b) => b.type === type);
            return board ? safeString(board.id) : null;
        };

        return new User({
            id: safeString(data.id),
            email: safeString(data.email),
            username: safeString(data.userId),
            name: safeString(data.name),
            contact: safeString(data.contact),
            avatar: data.profileImage || null,
            role: data.role,
            isActive: data.isActive,
            joinStatus: data.joinStatus,

            apartmentId: data.apartmentId ? safeString(data.apartmentId) : null,
            apartmentName: data.apartment?.apartmentName ?? null,
            residentDong: data.resident?.building ?? null,
            residentHo: data.resident?.unitNumber ?? null,

            boardIds: data.apartment
                ? {
                      NOTICE: findBoardId('NOTICE'),
                      COMPLAINT: findBoardId('COMPLAINT'),
                      POLL: findBoardId('POLL'),
                  }
                : null,

            createdAt: LocalDateTime(data.createdAt).format(DATE_FORMAT),
            updatedAt: LocalDateTime(data.updatedAt).format(DATE_FORMAT),
        });
    }
    static fromEntityList(data: UserData[]): User[] {
        return data.map((userData: UserData) => User.fromEntity(userData));
    }
}
