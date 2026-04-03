import { ApprovalStatus, HouseholdType, ResidenceStatus } from '../../generated/prisma';
import { ConflictError } from '../../src/errors/ConflictError';
import { NotFoundError } from '../../src/errors/NotFoundError';
import { createResident, existsResident, findResidentById, findResidents } from '../../src/repositories/resident.repository';
import { createOneResident, getResidentById, getResidents } from '../../src/services/resident.service';

jest.mock('../../src/repositories/resident.repository', () => ({
    findResidents: jest.fn(),
    findResidentById: jest.fn(),
    existsResident: jest.fn(),
    createResident: jest.fn(),
}));

const mockedFindResidents = findResidents as jest.MockedFunction<typeof findResidents>;
const mockedFindResidentById = findResidentById as jest.MockedFunction<typeof findResidentById>;
const mockedExistsResident = existsResident as jest.MockedFunction<typeof existsResident>;
const mockedCreateResident = createResident as jest.MockedFunction<typeof createResident>;

// repository가 반환하는 resident 모델 형태를 맞추기 위한 공통 mock 생성기
const makeResident = (
    overrides: Partial<{
        id: bigint;
        apartmentId: bigint;
        //userId: bigint | null;
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
    //userId: 10n,
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
    });

    describe('getResidents', () => {
        it('입주민 목록을 DTO 형태로 반환한다', async () => {
            mockedFindResidents.mockResolvedValue({
                residents: [makeResident()],
                totalCount: 1,
            });

            const result = await getResidents({
                apartmentId: 1n,
                query: {
                    page: 1,
                    limit: 20,
                    keyword: '홍길동',
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
                keyword: '홍길동',
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
                ],
                message: '입주민 목록 조회 성공',
                count: 1,
                totalCount: 1,
            });
        });
    });

    describe('getResidentById', () => {
        it('입주민 상세 조회에 성공한다', async () => {
            mockedFindResidentById.mockResolvedValue(
                makeResident({
                    id: 2n,
                    //userId: null,
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
                userId: undefined,
                building: '102',
                unitNumber: '1201',
                contact: '01099998888',
                name: '김철수',
                email: undefined,
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
                    //userId: null,
                    building: '103',
                    unitNumber: '1301',
                    contact: '01011112222',
                    name: '이영희',
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

            expect(mockedCreateResident).toHaveBeenCalledWith({
                apartmentId: 1n,
                building: '103',
                unitNumber: '1301',
                contact: '01011112222',
                name: '이영희',
                isHouseholder: HouseholdType.HOUSEHOLDER,
            });

            expect(result).toEqual({
                id: '3',
                userId: undefined,
                building: '103',
                unitNumber: '1301',
                contact: '01011112222',
                name: '이영희',
                email: undefined,
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
                        building: '101',
                        unitNumber: '1001',
                        contact: '01012345678',
                        name: '홍길동',
                        isHouseholder: HouseholdType.HOUSEHOLDER,
                    },
                }),
            ).rejects.toThrow(ConflictError);
        });
    });
});
