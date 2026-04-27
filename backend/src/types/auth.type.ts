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
        building: string | null;
        unitNumber: string | null;
    } | null;
    createdAt: Date;
    updatedAt: Date;
    apartmentId?: bigint | null;
}

export interface UserParam {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    joinStatus: JoinStatus;
    isActive: boolean;
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
    apartmentId?: string | null;
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

        return new User({
            id: safeString(data.id),
            email: safeString(data.email),
            username: safeString(data.userId),
            name: safeString(data.name),
            contact: safeString(data.contact),
            avatar: this.generateFullUrl(data.profileImage),
            role: data.role,
            isActive: data.isActive,
            joinStatus: data.joinStatus,

            apartmentId: data.apartmentId ? safeString(data.apartmentId) : null,
            apartmentName: data.apartment?.apartmentName ?? null,
            residentDong: data.resident?.building ?? null,
            residentHo: data.resident?.unitNumber ?? null,

            boardIds: this.mapBoardIds(data.apartment),

            createdAt: LocalDateTime(data.createdAt).format(DATE_FORMAT),
            updatedAt: LocalDateTime(data.updatedAt).format(DATE_FORMAT),
        });
    }

    static fromEntityList(data: UserData[]): User[] {
        if (!data || !Array.isArray(data)) return [];
        return data.map((userData: UserData) => User.fromEntity(userData));
    }

    private static generateFullUrl(key: string | null): string | null {
        if (!key) return null;
        if (key.startsWith('http')) return key;
        return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    private static mapBoardIds(apartment: UserData['apartment']) {
        if (!apartment) return null;
        const boards = apartment.board || [];
        const findId = (type: 'NOTICE' | 'COMPLAINT' | 'POLL') => {
            const board = boards.find((b) => b.type === type);
            return board ? safeString(board.id) : null;
        };
        return {
            NOTICE: findId('NOTICE'),
            COMPLAINT: findId('COMPLAINT'),
            POLL: findId('POLL'),
        };
    }
}
