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
    createdAt: Date;
    updatedAt: Date;
}

export interface UserParam {
    id: string;
    email: string;
    username: string;
    name: string;
    contact: string;
    profileImage: string | null;
    role: UserRole;
    isActive: boolean;
    joinStatus: JoinStatus;
    createdAt: string;
    updatedAt: string;
}
export class User {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly name: string;
    readonly contact: string;
    readonly profileImage: string | null;
    readonly role: UserRole;
    readonly isActive: boolean;
    readonly joinStatus: JoinStatus;
    readonly createdAt: string;
    readonly updatedAt: string;

    constructor(params: UserParam) {
        this.id = params.id;
        this.email = params.email;
        this.username = params.username;
        this.name = params.name;
        this.contact = params.contact;
        this.profileImage = params.profileImage;
        this.role = params.role;
        this.isActive = params.isActive;
        this.joinStatus = params.joinStatus;
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
            profileImage: data.profileImage || null,
            role: data.role,
            isActive: data.isActive,
            joinStatus: data.joinStatus,
            createdAt: LocalDateTime(data.createdAt).format(DATE_FORMAT),
            updatedAt: LocalDateTime(data.updatedAt).format(DATE_FORMAT),
        });
    }
    static fromEntityList(data: UserData[]): User[] {
        return data.map((userData: UserData) => User.fromEntity(userData));
    }
}
