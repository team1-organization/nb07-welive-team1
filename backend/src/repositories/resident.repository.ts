import { HouseholdType, Prisma, ResidenceStatus } from '../../generated/prisma';
import { prisma } from '../lib/prisma';

type FindResidentsParams = {
    apartmentId: bigint;
    page: number;
    limit: number;
    building?: string;
    unitNumber?: string;
    residenceStatus?: ResidenceStatus;
    isRegistered?: boolean;
    keyword?: string;
};

type CreateResidentParams = {
    apartmentId: bigint;
    building: string;
    unitNumber: string;
    contact: string;
    name: string;
    isHouseholder: HouseholdType;
};

// 전달받은 필터 조건을 Prisma where 조건으로 변환
const buildResidentWhere = ({
    apartmentId,
    building,
    unitNumber,
    residenceStatus,
    isRegistered,
    keyword,
}: Omit<FindResidentsParams, 'page' | 'limit'>): Prisma.ResidentWhereInput => {
    // 기본 조건: 같은 아파트 입주민만 조회
    const where: Prisma.ResidentWhereInput = {
        apartmentId,
    };

    // 동 필터
    if (building) {
        where.building = building;
    }

    // 호수 필터
    if (unitNumber) {
        where.unitNumber = unitNumber;
    }

    // 거주 여부 필터
    if (residenceStatus) {
        where.residenceStatus = residenceStatus;
    }

    // 위리브 가입 여부 필터
    if (typeof isRegistered === 'boolean') {
        where.isRegistered = isRegistered;
    }

    // 이름 또는 연락처 키워드 검색
    if (keyword) {
        where.OR = [
            {
                name: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            },
            {
                contact: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            },
        ];
    }

    return where;
};

// 입주민 목록과 전체 개수를 함께 조회
export const findResidents = async ({
    apartmentId,
    page,
    limit,
    building,
    unitNumber,
    residenceStatus,
    isRegistered,
    keyword,
}: FindResidentsParams) => {
    // 필터 조건 생성
    const where = buildResidentWhere({
        apartmentId,
        building,
        unitNumber,
        residenceStatus,
        isRegistered,
        keyword,
    });

    // 페이지네이션 offset 계산
    const skip = (page - 1) * limit;

    // 전체 개수와 목록을 한 번에 조회
    const [totalCount, residents] = await prisma.$transaction([
        prisma.resident.count({ where }),
        prisma.resident.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ building: 'asc' }, { unitNumber: 'asc' }, { createdAt: 'desc' }],
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
        }),
    ]);

    return {
        residents,
        totalCount,
    };
};

// 특정 입주민 상세 조회
export const findResidentWithUser = async (residentId: bigint, apartmentId: bigint) => {
    return prisma.resident.findFirst({
        where: {
            id: residentId,
            apartmentId,
        },
        include: {
            user: {
                select: {
                    email: true,
                },
            },
        },
    });
};

// 같은 아파트 내 동일 입주민 존재 여부 확인
export const existsResident = async ({
    apartmentId,
    building,
    unitNumber,
    contact,
}: Pick<CreateResidentParams, 'apartmentId' | 'building' | 'unitNumber' | 'contact'>) => {
    const resident = await prisma.resident.findUnique({
        where: {
            apartmentId_building_unitNumber_contact: {
                apartmentId,
                building,
                unitNumber,
                contact,
            },
        },
    });

    return Boolean(resident);
};

// 입주민 개별 등록
export const createResident = async ({ apartmentId, building, unitNumber, contact, name, isHouseholder }: CreateResidentParams) => {
    return prisma.resident.create({
        data: {
            apartmentId,
            building,
            unitNumber,
            contact,
            name,
            isHouseholder,
        },
        include: {
            user: {
                select: {
                    email: true,
                },
            },
        },
    });
};

export async function findResidentById(residentId: string) {
    return prisma.resident.findUnique({
        where: {
            id: BigInt(residentId),
        },
        include: {
            user: true,
        },
    });
}
