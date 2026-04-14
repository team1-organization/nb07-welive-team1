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

type FindResidentsForDownloadParams = Omit<FindResidentsParams, 'page' | 'limit'>;

type CreateResidentParams = {
    apartmentId: bigint;
    building: string;
    unitNumber: string;
    contact: string;
    name: string;
    isHouseholder: HouseholdType;
};

type CreateResidentWithUserParams = CreateResidentParams & {
    userId: bigint;
};

type CreateResidentsParams = {
    residents: CreateResidentParams[];
};

type UpdateResidentParams = {
    residentId: bigint;
    apartmentId: bigint;
    building?: string;
    unitNumber?: string;
    contact?: string;
    name?: string;
    isHouseholder?: HouseholdType;
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

// resident id 타입 정리
const toResidentId = (residentId: bigint | string) => {
    return typeof residentId === 'bigint' ? residentId : BigInt(residentId);
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
                        id: true,
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

// 파일 다운로드용 입주민 전체 목록 조회
export const findResidentsForDownload = async ({
    apartmentId,
    building,
    unitNumber,
    residenceStatus,
    isRegistered,
    keyword,
}: FindResidentsForDownloadParams) => {
    const where = buildResidentWhere({
        apartmentId,
        building,
        unitNumber,
        residenceStatus,
        isRegistered,
        keyword,
    });

    return prisma.resident.findMany({
        where,
        orderBy: [{ building: 'asc' }, { unitNumber: 'asc' }, { createdAt: 'desc' }],
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });
};

// 특정 입주민 조회
export const findResidentById = async (residentId: bigint | string, apartmentId?: bigint) => {
    return prisma.resident.findFirst({
        where: {
            id: toResidentId(residentId),
            ...(apartmentId ? { apartmentId } : {}),
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });
};

// 같은 아파트의 특정 입주민 조회
export const findResidentWithApartment = async (residentId: bigint, apartmentId: bigint) => {
    return findResidentById(residentId, apartmentId);
};

// 사용자 기반 입주민 생성용 사용자 조회
export const findUserByIdForResidentCreation = async (userId: bigint, apartmentId: bigint) => {
    return prisma.user.findFirst({
        where: {
            id: userId,
            apartmentId,
        },
        select: {
            id: true,
            name: true,
            contact: true,
            email: true,
            apartmentId: true,
            residentId: true,
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
                    id: true,
                    email: true,
                },
            },
        },
    });
};

// 사용자와 연결된 입주민 생성
export const createResidentWithUser = async ({
    apartmentId,
    userId,
    building,
    unitNumber,
    contact,
    name,
    isHouseholder,
}: CreateResidentWithUserParams) => {
    return prisma.$transaction(async (tx) => {
        const resident = await tx.resident.create({
            data: {
                apartmentId,
                building,
                unitNumber,
                contact,
                name,
                isHouseholder,
            },
        });

        await tx.user.update({
            where: {
                id: userId,
            },
            data: {
                residentId: resident.id,
            },
        });

        return tx.resident.findUniqueOrThrow({
            where: {
                id: resident.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
    });
};

// 파일 업로드용 입주민 다건 생성
export const createResidents = async ({ residents }: CreateResidentsParams) => {
    return prisma.resident.createMany({
        data: residents.map((resident) => ({
            apartmentId: resident.apartmentId,
            building: resident.building,
            unitNumber: resident.unitNumber,
            contact: resident.contact,
            name: resident.name,
            isHouseholder: resident.isHouseholder,
        })),
    });
};

// 입주민 정보 수정
export const updateResident = async ({
    residentId,
    apartmentId: _apartmentId,
    building,
    unitNumber,
    contact,
    name,
    isHouseholder,
}: UpdateResidentParams) => {
    return prisma.resident.update({
        where: {
            id: residentId,
        },
        data: {
            building,
            unitNumber,
            contact,
            name,
            isHouseholder,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });
};

// 입주민 정보 삭제
export const deleteResident = async (residentId: bigint) => {
    return prisma.resident.delete({
        where: {
            id: residentId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });
};
