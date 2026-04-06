import { jest } from '@jest/globals';
import { ApprovalStatus, HouseholdType, ResidenceStatus } from '../../generated/prisma';
import { ConflictError } from '../../src/errors/ConflictError';
import { NotFoundError } from '../../src/errors/NotFoundError';
import { prisma } from '../../src/lib/prisma';
import { createResident, existsResident, findResidentById, findResidents, updateResident } from '../../src/repositories/resident.repository';
import { createOneResident, deleteResidentById, getResidentById, getResidents, updateResidentById } from '../../src/services/resident.service';

jest.mock('../../src/repositories/resident.repository', () => ({
    findResidents: jest.fn(),
    findResidentById: jest.fn(),
    existsResident: jest.fn(),
    createResident: jest.fn(),
    updateResident: jest.fn(),
}));

jest.mock('../../src/lib/prisma', () => ({
    prisma: {
        $transaction: jest.fn(),
    },
}));

const mockedFindResidents = findResidents as jest.MockedFunction<typeof findResidents>;
const mockedFindResidentById = findResidentById as jest.MockedFunction<typeof findResidentById>;
const mockedExistsResident = existsResident as jest.MockedFunction<typeof existsResident>;
const mockedCreateResident = createResident as jest.MockedFunction<typeof createResident>;
const mockedUpdateResident = updateResident as jest.MockedFunction<typeof updateResident>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

const tx = {
    vote: {
        deleteMany: jest.fn<() => Promise<{ count: number }>>(),
    },
    comment: {
        deleteMany: jest.fn<() => Promise<{ count: number }>>(),
    },
    resident: {
        delete: jest.fn<() => Promise<ReturnType<typeof makeResident>>>(),
    },
    user: {
        delete: jest.fn<() => Promise<object>>(),
    },
};

const makeResident = (
    overrides: Partial<{
        id: bigint;
        apartmentId: bigint;
        userId: bigint | null;
        building: string;
        unitNumber: string;
        contact: string;
        name: string;
        residenceStatus: ResidenceStatus;
        isHouseholder: HouseholdType;
        isRegistered: boolean;
        approvalStatus: ApprovalStatus;
        createdAt: Date;
        updatedAt: Date;
        user: { id: bigint; email: string } | null;
    }> = {},
) => ({
    id: 1n,
    apartmentId: 1n,
    userId: 10n,
    building: '101',
    unitNumber: '1001',
    contact: '01012345678',
    name: '홍길동',
    residenceStatus: ResidenceStatus.RESIDENCE,
    isHouseholder: HouseholdType.HOUSEHOLDER,
    isRegistered: true,
    approvalStatus: ApprovalStatus.APPROVED,
    createdAt: new Date('2026-03-31T00:00:00.000Z'),
    updatedAt: new Date('2026-03-31T00:00:00.000Z'),
    user: {
        id: 10n,
        email: 'hong@example.com',
    },
    ...overrides,
});

describe('resident.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        tx.vote.deleteMany.mockResolvedValue({ count: 0 });
        tx.comment.deleteMany.mockResolvedValue({ count: 0 });
        tx.user.delete.mockResolvedValue({});
        tx.resident.delete.mockResolvedValue(makeResident());

        (mockedPrisma.$transaction as jest.Mock).mockImplementation(
            async (callback: unknown) => {
                const transactionCallback = callback as (trx: typeof tx) => Promise<unknown>;

                return transactionCallback(tx);
            },
        );
    });

    describe('getResidents', () => {
        it('입주민 목록을 DTO 형태로 반환한다', async () => {
            mockedFindResidents.mockResolvedValue({
                residents: [
                    makeResident(),
                    makeResident({
                        id: 2n,
                        userId: null,
                        building: '102',
                        unitNumber: '1201',
                        contact: '01099998888',
                        name: '김철수',
                        isHouseholder: HouseholdType.HOUSEMEMBER,
                        isRegistered: false,
                        approvalStatus: ApprovalStatus.PENDING,
                        user: null,
                    }),
                ],
                totalCount: 2,
            });

            const result = await getResidents({
                apartmentId: 1n,
                query: {
                    page: 1,
                    limit: 20,
                    building: undefined,
                    unitNumber: undefined,
                    residenceStatus: undefined,
                    isRegistered: undefined,
                    keyword: undefined,
                },
            });

            expect(result).toEqual({
                residents: [
                    {
                        id: '1',
                        userId: '10',
                        building: '101',
                        unitNumber: '1001',
                        contact: '01012345678',
                        name: '홍길동',
                        email: 'hong@example.com',
                        residenceStatus: ResidenceStatus.RESIDENCE,
                        isHouseholder: HouseholdType.HOUSEHOLDER,
                        isRegistered: true,
                        approvalStatus: ApprovalStatus.APPROVED,
                    },
                    {
                        id: '2',
                        userId: null,
                        building: '102',
                        unitNumber: '1201',
                        contact: '01099998888',
                        name: '김철수',
                        email: null,
                        residenceStatus: ResidenceStatus.RESIDENCE,
                        isHouseholder: HouseholdType.HOUSEMEMBER,
                        isRegistered: false,
                        approvalStatus: ApprovalStatus.PENDING,
                    },
                ],
                message: '입주민 목록 조회 성공',
                count: 2,
                totalCount: 2,
            });
        });
    });

    describe('getResidentById', () => {
        it('입주민 상세 조회에 성공한다', async () => {
            mockedFindResidentById.mockResolvedValue(
                makeResident({
                    id: 2n,
                    userId: null,
                    building: '102',
                    unitNumber: '1201',
                    contact: '01099998888',
                    name: '김철수',
                    isHouseholder: HouseholdType.HOUSEMEMBER,
                    isRegistered: false,
                    approvalStatus: ApprovalStatus.PENDING,
                    user: null,
                }),
            );

            const result = await getResidentById({
                apartmentId: 1n,
                residentId: 2n,
            });

            expect(result).toEqual({
                id: '2',
                userId: null,
                building: '102',
                unitNumber: '1201',
                contact: '01099998888',
                name: '김철수',
                email: null,
                residenceStatus: ResidenceStatus.RESIDENCE,
                isHouseholder: HouseholdType.HOUSEMEMBER,
                isRegistered: false,
                approvalStatus: ApprovalStatus.PENDING,
            });
        });

        it('입주민이 없으면 NotFoundError를 던진다', async () => {
            mockedFindResidentById.mockResolvedValue(null);

            await expect(
                getResidentById({
                    apartmentId: 1n,
                    residentId: 999n,
                }),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('createOneResident', () => {
        it('입주민 개별 등록에 성공한다', async () => {
            mockedExistsResident.mockResolvedValue(false);
            mockedCreateResident.mockResolvedValue(
                makeResident({
                    id: 3n,
                    userId: null,
                    building: '103',
                    unitNumber: '1301',
                    contact: '01011112222',
                    name: '이영희',
                    isHouseholder: HouseholdType.HOUSEHOLDER,
                    isRegistered: false,
                    approvalStatus: ApprovalStatus.PENDING,
                    user: null,
                }),
            );

            const result = await createOneResident({
                apartmentId: 1n,
                body: {
                    building: '103',
                    unitNumber: '1301',
                    contact: '01011112222',
                    name: '이영희',
                    isHouseholder: HouseholdType.HOUSEHOLDER,
                },
            });

            expect(mockedExistsResident).toHaveBeenCalledWith({
                apartmentId: 1n,
                building: '103',
                unitNumber: '1301',
                contact: '01011112222',
            });

            expect(result).toEqual({
                id: '3',
                userId: null,
                building: '103',
                unitNumber: '1301',
                contact: '01011112222',
                name: '이영희',
                email: null,
                residenceStatus: ResidenceStatus.RESIDENCE,
                isHouseholder: HouseholdType.HOUSEHOLDER,
                isRegistered: false,
                approvalStatus: ApprovalStatus.PENDING,
            });
        });

        it('중복 입주민이면 ConflictError를 던진다', async () => {
            mockedExistsResident.mockResolvedValue(true);

            await expect(
                createOneResident({
                    apartmentId: 1n,
                    body: {
                        building: '103',
                        unitNumber: '1301',
                        contact: '01011112222',
                        name: '이영희',
                        isHouseholder: HouseholdType.HOUSEHOLDER,
                    },
                }),
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('updateResidentById', () => {
        it('입주민 정보 수정에 성공한다', async () => {
            mockedFindResidentById.mockResolvedValue(
                makeResident({
                    id: 4n,
                    building: '101',
                    unitNumber: '1001',
                    contact: '01012345678',
                    name: '홍길동',
                }),
            );

            mockedExistsResident.mockResolvedValue(false);

            mockedUpdateResident.mockResolvedValue(
                makeResident({
                    id: 4n,
                    building: '102',
                    unitNumber: '1202',
                    contact: '01088887777',
                    name: '홍길순',
                    isHouseholder: HouseholdType.HOUSEMEMBER,
                }),
            );

            const result = await updateResidentById({
                apartmentId: 1n,
                residentId: 4n,
                body: {
                    building: '102',
                    unitNumber: '1202',
                    contact: '01088887777',
                    name: '홍길순',
                    isHouseholder: HouseholdType.HOUSEMEMBER,
                },
            });

            expect(mockedFindResidentById).toHaveBeenCalledWith(4n, 1n);
            expect(mockedUpdateResident).toHaveBeenCalledWith({
                residentId: 4n,
                apartmentId: 1n,
                building: '102',
                unitNumber: '1202',
                contact: '01088887777',
                name: '홍길순',
                isHouseholder: HouseholdType.HOUSEMEMBER,
            });

            expect(result).toEqual({
                id: '4',
                userId: '10',
                building: '102',
                unitNumber: '1202',
                contact: '01088887777',
                name: '홍길순',
                email: 'hong@example.com',
                residenceStatus: ResidenceStatus.RESIDENCE,
                isHouseholder: HouseholdType.HOUSEMEMBER,
                isRegistered: true,
                approvalStatus: ApprovalStatus.APPROVED,
            });
        });

        it('수정 대상 입주민이 없으면 NotFoundError를 던진다', async () => {
            mockedFindResidentById.mockResolvedValue(null);

            await expect(
                updateResidentById({
                    apartmentId: 1n,
                    residentId: 999n,
                    body: {
                        name: '수정이름',
                    },
                }),
            ).rejects.toThrow(NotFoundError);
        });

        it('수정 결과가 다른 입주민과 중복이면 ConflictError를 던진다', async () => {
            mockedFindResidentById.mockResolvedValue(
                makeResident({
                    id: 4n,
                    building: '101',
                    unitNumber: '1001',
                    contact: '01012345678',
                }),
            );

            mockedExistsResident.mockResolvedValue(true);

            await expect(
                updateResidentById({
                    apartmentId: 1n,
                    residentId: 4n,
                    body: {
                        building: '102',
                        unitNumber: '1202',
                        contact: '01088887777',
                    },
                }),
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('deleteResidentById', () => {
        it('연결 계정이 없는 입주민 삭제에 성공한다', async () => {
            mockedFindResidentById.mockResolvedValue(
                makeResident({
                    id: 5n,
                    userId: null,
                    user: null,
                }),
            );

            tx.resident.delete.mockResolvedValue(
                makeResident({
                    id: 5n,
                    userId: null,
                    user: null,
                }),
            );

            const result = await deleteResidentById({
                apartmentId: 1n,
                residentId: 5n,
            });

            expect(tx.vote.deleteMany).not.toHaveBeenCalled();
            expect(tx.comment.deleteMany).not.toHaveBeenCalled();
            expect(tx.user.delete).not.toHaveBeenCalled();
            expect(tx.resident.delete).toHaveBeenCalledWith({
                where: {
                    id: 5n,
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

            expect(result).toEqual({
                id: '5',
                userId: null,
                building: '101',
                unitNumber: '1001',
                contact: '01012345678',
                name: '홍길동',
                email: null,
                residenceStatus: ResidenceStatus.RESIDENCE,
                isHouseholder: HouseholdType.HOUSEHOLDER,
                isRegistered: true,
                approvalStatus: ApprovalStatus.APPROVED,
            });
        });

        it('연결 계정이 있는 입주민 삭제에 성공한다', async () => {
            mockedFindResidentById.mockResolvedValue(
                makeResident({
                    id: 6n,
                    userId: 10n,
                    user: {
                        id: 10n,
                        email: 'hong@example.com',
                    },
                }),
            );

            tx.resident.delete.mockResolvedValue(
                makeResident({
                    id: 6n,
                    userId: 10n,
                    user: {
                        id: 10n,
                        email: 'hong@example.com',
                    },
                }),
            );

            const result = await deleteResidentById({
                apartmentId: 1n,
                residentId: 6n,
            });

            expect(tx.vote.deleteMany).toHaveBeenCalledWith({
                where: {
                    userId: 10n,
                },
            });

            expect(tx.comment.deleteMany).toHaveBeenCalledWith({
                where: {
                    userId: 10n,
                },
            });

            expect(tx.resident.delete).toHaveBeenCalledWith({
                where: {
                    id: 6n,
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

            expect(tx.user.delete).toHaveBeenCalledWith({
                where: {
                    id: 10n,
                },
            });

            expect(result).toEqual({
                id: '6',
                userId: '10',
                building: '101',
                unitNumber: '1001',
                contact: '01012345678',
                name: '홍길동',
                email: 'hong@example.com',
                residenceStatus: ResidenceStatus.RESIDENCE,
                isHouseholder: HouseholdType.HOUSEHOLDER,
                isRegistered: true,
                approvalStatus: ApprovalStatus.APPROVED,
            });
        });

        it('삭제 대상 입주민이 없으면 NotFoundError를 던진다', async () => {
            mockedFindResidentById.mockResolvedValue(null);

            await expect(
                deleteResidentById({
                    apartmentId: 1n,
                    residentId: 999n,
                }),
            ).rejects.toThrow(NotFoundError);
        });
    });
});
