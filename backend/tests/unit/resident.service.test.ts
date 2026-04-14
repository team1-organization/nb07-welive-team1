import { jest } from '@jest/globals';
import { ApprovalStatus, HouseholdType, ResidenceStatus } from '../../generated/prisma';
import { BadRequestError } from '../../src/errors/BadRequestError';
import { ConflictError } from '../../src/errors/ConflictError';
import { NotFoundError } from '../../src/errors/NotFoundError';
import { prisma } from '../../src/lib/prisma';
import {
    createResident,
    createResidents,
    existsResident,
    findResidents,
    findResidentsForDownload,
    findResidentWithApartment,
    updateResident,
} from '../../src/repositories/resident.repository';
import {
    createOneResident,
    createResidentsFromFile,
    deleteResidentById,
    downloadResidentsFile,
    downloadResidentTemplate,
    getResidentById,
    getResidents,
    updateResidentById,
} from '../../src/services/resident.service';

jest.mock('../../src/repositories/resident.repository', () => ({
    findResidents: jest.fn(),
    findResidentsForDownload: jest.fn(),
    findResidentWithApartment: jest.fn(),
    existsResident: jest.fn(),
    createResident: jest.fn(),
    createResidents: jest.fn(),
    updateResident: jest.fn(),
}));

jest.mock('../../src/lib/prisma', () => ({
    prisma: {
        $transaction: jest.fn(),
    },
}));

const mockedFindResidents = findResidents as jest.MockedFunction<typeof findResidents>;
const mockedFindResidentsForDownload = findResidentsForDownload as jest.MockedFunction<typeof findResidentsForDownload>;
const mockedFindResidentWithApartment = findResidentWithApartment as jest.MockedFunction<typeof findResidentWithApartment>;
const mockedExistsResident = existsResident as jest.MockedFunction<typeof existsResident>;
const mockedCreateResident = createResident as jest.MockedFunction<typeof createResident>;
const mockedCreateResidents = createResidents as jest.MockedFunction<typeof createResidents>;
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

        const mockedTransaction = mockedPrisma.$transaction as jest.Mock;

        mockedTransaction.mockImplementation(async (callback: unknown) => {
            if (typeof callback !== 'function') {
                throw new Error('Transaction callback is required.');
            }

            return callback(tx);
        });
    });

    describe('downloadResidentTemplate', () => {
        it('업로드 템플릿 문자열을 반환한다', async () => {
            const result = await downloadResidentTemplate();

            expect(result).toBe('name,contact,building,unitNumber,isHouseholder\n');
        });
    });

    describe('getResidents', () => {
        it('입주민 목록을 DTO 형태로 반환한다', async () => {
            mockedFindResidents.mockResolvedValue({
                residents: [
                    makeResident({
                        id: 1n,
                        building: '101',
                        unitNumber: '1001',
                    }),
                    makeResident({
                        id: 2n,
                        building: '102',
                        unitNumber: '1202',
                        user: null,
                        isRegistered: false,
                        approvalStatus: ApprovalStatus.PENDING,
                    }),
                ],
                totalCount: 2,
            });

            const result = await getResidents({
                apartmentId: 1n,
                query: {
                    page: 1,
                    limit: 20,
                },
            });

            expect(mockedFindResidents).toHaveBeenCalledWith({
                apartmentId: 1n,
                page: 1,
                limit: 20,
                building: undefined,
                unitNumber: undefined,
                residenceStatus: undefined,
                isRegistered: undefined,
                keyword: undefined,
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
                        unitNumber: '1202',
                        contact: '01012345678',
                        name: '홍길동',
                        email: null,
                        residenceStatus: ResidenceStatus.RESIDENCE,
                        isHouseholder: HouseholdType.HOUSEHOLDER,
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

    describe('downloadResidentsFile', () => {
        it('입주민 목록을 CSV 문자열로 반환한다', async () => {
            mockedFindResidentsForDownload.mockResolvedValue([
                makeResident({
                    building: '101',
                    unitNumber: '1001',
                    name: '홍길동',
                    contact: '01012345678',
                    residenceStatus: ResidenceStatus.RESIDENCE,
                    isHouseholder: HouseholdType.HOUSEHOLDER,
                    isRegistered: true,
                }),
                makeResident({
                    id: 2n,
                    building: '102',
                    unitNumber: '1202',
                    name: '김영희',
                    contact: '01099998888',
                    residenceStatus: ResidenceStatus.NO_RESIDENCE,
                    isHouseholder: HouseholdType.HOUSEMEMBER,
                    isRegistered: false,
                    user: null,
                }),
            ]);

            const result = await downloadResidentsFile({
                apartmentId: 1n,
                query: {
                    page: 1,
                    limit: 20,
                },
            });

            expect(mockedFindResidentsForDownload).toHaveBeenCalledWith({
                apartmentId: 1n,
                building: undefined,
                unitNumber: undefined,
                residenceStatus: undefined,
                isRegistered: undefined,
                keyword: undefined,
            });

            expect(result).toBe(
                'building,unitNumber,name,contact,residenceStatus,isHouseholder,isRegistered\n' +
                    '101,1001,홍길동,01012345678,RESIDENCE,HOUSEHOLDER,true\n' +
                    '102,1202,김영희,01099998888,NO_RESIDENCE,HOUSEMEMBER,false\n',
            );
        });
    });

    describe('getResidentById', () => {
        it('입주민 상세 조회에 성공한다', async () => {
            mockedFindResidentWithApartment.mockResolvedValue(
                makeResident({
                    id: 3n,
                    building: '103',
                    unitNumber: '1301',
                }),
            );

            const result = await getResidentById({
                apartmentId: 1n,
                residentId: 3n,
            });

            expect(mockedFindResidentWithApartment).toHaveBeenCalledWith(3n, 1n);
            expect(result).toEqual({
                id: '3',
                userId: '10',
                building: '103',
                unitNumber: '1301',
                contact: '01012345678',
                name: '홍길동',
                email: 'hong@example.com',
                residenceStatus: ResidenceStatus.RESIDENCE,
                isHouseholder: HouseholdType.HOUSEHOLDER,
                isRegistered: true,
                approvalStatus: ApprovalStatus.APPROVED,
            });
        });

        it('입주민이 없으면 NotFoundError를 던진다', async () => {
            mockedFindResidentWithApartment.mockResolvedValue(null);

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
                    id: 4n,
                    building: '103',
                    unitNumber: '1301',
                    contact: '01011112222',
                    name: '이영희',
                    isHouseholder: HouseholdType.HOUSEMEMBER,
                    user: null,
                    isRegistered: false,
                    approvalStatus: ApprovalStatus.PENDING,
                }),
            );

            const result = await createOneResident({
                apartmentId: 1n,
                body: {
                    building: '103',
                    unitNumber: '1301',
                    contact: '01011112222',
                    name: '이영희',
                    isHouseholder: HouseholdType.HOUSEMEMBER,
                },
            });

            expect(mockedExistsResident).toHaveBeenCalledWith({
                apartmentId: 1n,
                building: '103',
                unitNumber: '1301',
                contact: '01011112222',
            });

            expect(mockedCreateResident).toHaveBeenCalledWith({
                apartmentId: 1n,
                building: '103',
                unitNumber: '1301',
                contact: '01011112222',
                name: '이영희',
                isHouseholder: HouseholdType.HOUSEMEMBER,
            });

            expect(result).toEqual({
                id: '4',
                userId: null,
                building: '103',
                unitNumber: '1301',
                contact: '01011112222',
                name: '이영희',
                email: null,
                residenceStatus: ResidenceStatus.RESIDENCE,
                isHouseholder: HouseholdType.HOUSEMEMBER,
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

    describe('createResidentsFromFile', () => {
        it('파일 업로드로 입주민을 다건 등록한다', async () => {
            mockedExistsResident.mockResolvedValue(false);
            mockedCreateResidents.mockResolvedValue({ count: 2 });

            const fileBuffer = Buffer.from(
                'name,contact,building,unitNumber,isHouseholder\n' +
                    '홍길동,01012345678,101,1001,HOUSEHOLDER\n' +
                    '김영희,01099998888,102,1202,HOUSEMEMBER\n',
                'utf-8',
            );

            const result = await createResidentsFromFile({
                apartmentId: 1n,
                fileBuffer,
            });

            expect(mockedCreateResidents).toHaveBeenCalledWith({
                residents: [
                    {
                        apartmentId: 1n,
                        building: '101',
                        unitNumber: '1001',
                        contact: '01012345678',
                        name: '홍길동',
                        isHouseholder: HouseholdType.HOUSEHOLDER,
                    },
                    {
                        apartmentId: 1n,
                        building: '102',
                        unitNumber: '1202',
                        contact: '01099998888',
                        name: '김영희',
                        isHouseholder: HouseholdType.HOUSEMEMBER,
                    },
                ],
            });

            expect(result).toEqual({
                message: '2명의 입주민이 등록되었습니다',
                count: 2,
            });
        });

        it('파일이 비어 있으면 BadRequestError를 던진다', async () => {
            const fileBuffer = Buffer.from('', 'utf-8');

            await expect(
                createResidentsFromFile({
                    apartmentId: 1n,
                    fileBuffer,
                }),
            ).rejects.toThrow(new BadRequestError('파일이 비어 있습니다.'));
        });

        it('파일 양식이 올바르지 않으면 BadRequestError를 던진다', async () => {
            const fileBuffer = Buffer.from(
                'wrong,contact,building,unitNumber,isHouseholder\n' + '홍길동,01012345678,101,1001,HOUSEHOLDER\n',
                'utf-8',
            );

            await expect(
                createResidentsFromFile({
                    apartmentId: 1n,
                    fileBuffer,
                }),
            ).rejects.toThrow(new BadRequestError('파일 양식이 올바르지 않습니다. 양식 다운로드 후 다시 업로드해주세요.'));
        });

        it('파일 안에 중복된 입주민 정보가 있으면 ConflictError를 던진다', async () => {
            const fileBuffer = Buffer.from(
                'name,contact,building,unitNumber,isHouseholder\n' +
                    '홍길동,01012345678,101,1001,HOUSEHOLDER\n' +
                    '홍길순,01012345678,101,1001,HOUSEMEMBER\n',
                'utf-8',
            );

            await expect(
                createResidentsFromFile({
                    apartmentId: 1n,
                    fileBuffer,
                }),
            ).rejects.toThrow(new ConflictError('동, 호수, 연락처가 동일한 입주민 정보가 파일 안에 중복되어 있습니다.'));
        });

        it('이미 등록된 입주민 정보가 파일에 포함되어 있으면 ConflictError를 던진다', async () => {
            mockedExistsResident.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

            const fileBuffer = Buffer.from(
                'name,contact,building,unitNumber,isHouseholder\n' +
                    '홍길동,01012345678,101,1001,HOUSEHOLDER\n' +
                    '김영희,01099998888,102,1202,HOUSEMEMBER\n',
                'utf-8',
            );

            await expect(
                createResidentsFromFile({
                    apartmentId: 1n,
                    fileBuffer,
                }),
            ).rejects.toThrow(new ConflictError('이미 등록된 입주민 정보가 파일에 포함되어 있습니다.'));
        });

        it('세대구분 값이 올바르지 않으면 BadRequestError를 던진다', async () => {
            const fileBuffer = Buffer.from('name,contact,building,unitNumber,isHouseholder\n' + '홍길동,01012345678,101,1001,OWNER\n', 'utf-8');

            await expect(
                createResidentsFromFile({
                    apartmentId: 1n,
                    fileBuffer,
                }),
            ).rejects.toThrow(new BadRequestError('2번째 행의 세대구분 값이 올바르지 않습니다. HOUSEHOLDER 또는 HOUSEMEMBER로 입력해주세요.'));
        });
    });

    describe('updateResidentById', () => {
        it('입주민 정보 수정에 성공한다', async () => {
            mockedFindResidentWithApartment.mockResolvedValue(
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

            expect(mockedFindResidentWithApartment).toHaveBeenCalledWith(4n, 1n);
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
            mockedFindResidentWithApartment.mockResolvedValue(null);

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
            mockedFindResidentWithApartment.mockResolvedValue(
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
            mockedFindResidentWithApartment.mockResolvedValue(
                makeResident({
                    id: 5n,
                    user: null,
                }),
            );

            tx.resident.delete.mockResolvedValue(
                makeResident({
                    id: 5n,
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
            mockedFindResidentWithApartment.mockResolvedValue(
                makeResident({
                    id: 6n,
                    user: {
                        id: 10n,
                        email: 'hong@example.com',
                    },
                }),
            );

            tx.resident.delete.mockResolvedValue(
                makeResident({
                    id: 6n,
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
            mockedFindResidentWithApartment.mockResolvedValue(null);

            await expect(
                deleteResidentById({
                    apartmentId: 1n,
                    residentId: 999n,
                }),
            ).rejects.toThrow(NotFoundError);
        });
    });
});
