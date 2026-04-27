import { safeString } from '../utils/string.util';
import { default as LocalDateTime } from 'dayjs';
import { DATE_FORMAT } from '../dtos/common.dto';

export interface ApartmentData {
    id: bigint;
    apartmentName: string;
    apartmentAddress: string;
    apartmentManagementNumber?: string;
    description?: string | null;
    startComplexNumber?: string | null;
    endComplexNumber?: string | null;
    startDongNumber?: string | null;
    endDongNumber?: string | null;
    startFloorNumber?: string | null;
    endFloorNumber?: string | null;
    startHoNumber?: string | null;
    endHoNumber?: string | null;
    // 관리자 정보
    users?:
        | {
              id: bigint;
              name: string;
              contact: string;
              email: string;
              joinStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
          }[]
        | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

export interface ApartmentParam {
    id: string;
    name: string;
    address: string;
    officeNumber?: string | null;
    description?: string | null;
    startComplexNumber: string | null;
    endComplexNumber: string | null;
    startDongNumber: string | null;
    endDongNumber: string | null;
    startFloorNumber: string | null;
    endFloorNumber: string | null;
    startHoNumber: string | null;
    endHoNumber: string | null;
    apartmentStatus?: string;
    // 관리자 정보
    adminId?: string | null;
    adminName?: string | null;
    adminContact?: string | null;
    adminEmail?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export class Apartment {
    readonly id: string;
    readonly name: string;
    readonly address: string;
    readonly officeNumber: string | null;
    readonly description: string | null;
    readonly startComplexNumber: string | null;
    readonly endComplexNumber: string | null;
    readonly startDongNumber: string | null;
    readonly endDongNumber: string | null;
    readonly startFloorNumber: string | null;
    readonly endFloorNumber: string | null;
    readonly startHoNumber: string | null;
    readonly endHoNumber: string | null;
    readonly apartmentStatus?: string;
    readonly adminId?: string;
    readonly adminContact?: string;
    readonly adminEmail?: string;

    readonly createdAt?: string;
    readonly updatedAt?: string;

    readonly dongRange: { start: string | null; end: string | null };
    readonly hoRange: { start: string | null; end: string | null };

    constructor(params: ApartmentParam) {
        this.id = params.id;
        this.name = params.name;
        this.address = params.address;
        this.officeNumber = params.officeNumber ?? null;
        this.description = params.description ?? null;
        this.startComplexNumber = params.startComplexNumber;
        this.endComplexNumber = params.endComplexNumber;
        this.startDongNumber = params.startDongNumber;
        this.endDongNumber = params.endDongNumber;
        this.startFloorNumber = params.startFloorNumber;
        this.endFloorNumber = params.endFloorNumber;
        this.startHoNumber = params.startHoNumber;
        this.endHoNumber = params.endHoNumber;
        this.apartmentStatus = params.apartmentStatus;
        this.adminId = params.adminId ?? undefined;
        this.adminContact = params.adminContact ?? undefined;
        this.adminEmail = params.adminEmail ?? undefined;

        this.createdAt = params.createdAt;
        this.updatedAt = params.updatedAt;

        this.dongRange = { start: params.startDongNumber, end: params.endDongNumber };
        this.hoRange = { start: params.startHoNumber, end: params.endHoNumber };
    }

    static fromEntity(data: ApartmentData): Apartment {
        if (!data) throw new Error('데이터가 없습니다');
        const admin = data.users?.[0];
        return new Apartment({
            id: data.id.toString(),
            name: data.apartmentName,
            address: data.apartmentAddress,
            officeNumber: data.apartmentManagementNumber,
            description: data.description,
            startComplexNumber: data.startComplexNumber ?? null,
            endComplexNumber: data.endComplexNumber ?? null,
            startDongNumber: data.startDongNumber ?? null,
            endDongNumber: data.endDongNumber ?? null,
            startFloorNumber: data.startFloorNumber ?? null,
            endFloorNumber: data.endFloorNumber ?? null,
            startHoNumber: data.startHoNumber ?? null,
            endHoNumber: data.endHoNumber ?? null,
            // 관리자 도메인 로직에 따른 상태값 매핑
            apartmentStatus: admin?.joinStatus,
            adminId: admin?.id.toString(),
            adminContact: admin?.contact,
            adminEmail: admin?.email,

            createdAt: data.createdAt ? LocalDateTime(data.createdAt).format(DATE_FORMAT) : undefined,
            updatedAt: data.updatedAt ? LocalDateTime(data.updatedAt).format(DATE_FORMAT) : undefined,
        });
    }

    static fromEntityList(data: ApartmentData[]): Apartment[] {
        if (!data || !Array.isArray(data)) return [];
        return data.map((apartmentData: ApartmentData) => Apartment.fromEntity(apartmentData));
    }

    static fromSummaryEntity(data: ApartmentData) {
        if (!data) throw new Error('데이터가 없습니다');
        return {
            id: safeString(data.id),
            name: data.apartmentName,
            address: data.apartmentAddress,
        };
    }

    static fromSummaryEntityList(data: ApartmentData[]) {
        if (!data || !Array.isArray(data)) return [];
        return data.map((apartmentData: ApartmentData) => Apartment.fromSummaryEntity(apartmentData));
    }

    static fromPublicEntity(data: ApartmentData) {
        if (!data) throw new Error('데이터가 없습니다');
        return {
            id: safeString(data.id),
            name: data.apartmentName,
            address: data.apartmentAddress,
            startComplexNumber: data.startComplexNumber ?? null,
            endComplexNumber: data.endComplexNumber ?? null,
            startDongNumber: data.startDongNumber ?? null,
            endDongNumber: data.endDongNumber ?? null,
            startFloorNumber: data.startFloorNumber ?? null,
            endFloorNumber: data.endFloorNumber ?? null,
            startHoNumber: data.startHoNumber ?? null,
            endHoNumber: data.endHoNumber ?? null,
            dongRange: { start: data.startDongNumber, end: data.endDongNumber },
            hoRange: { start: data.startHoNumber, end: data.endHoNumber },
        };
    }
    static fromPublicEntityList(data: ApartmentData[]) {
        if (!data || !Array.isArray(data)) return [];
        return data.map((apartmentData: ApartmentData) => Apartment.fromPublicEntity(apartmentData));
    }
}
