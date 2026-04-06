import { HouseholdType, ResidenceStatus } from '../../generated/prisma';
import { CreateOneResidentDto, GetResidentsQueryDto, ResidentListResponseDto, ResidentResponseDto, UpdateResidentDto } from '../dtos/resident.dto';
import { ConflictError } from '../errors/ConflictError';
import { NotFoundError } from '../errors/NotFoundError';
import { prisma } from '../lib/prisma';
import { createResident, existsResident, findResidentById, findResidents, updateResident } from '../repositories/resident.repository';

type GetResidentsParams = {
    apartmentId: bigint;
    query: GetResidentsQueryDto;
};

type GetResidentByIdParams = {
    apartmentId: bigint;
    residentId: bigint;
};

type CreateOneResidentParams = {
    apartmentId: bigint;
    body: CreateOneResidentDto;
};

type UpdateResidentParams = {
    apartmentId: bigint;
    residentId: bigint;
    body: UpdateResidentDto;
};

type DeleteResidentParams = {
    apartmentId: bigint;
    residentId: bigint;
};

// 입주민 엔티티를 응답 DTO로 변환
const toResidentResponseDto = (resident: {
    id: bigint;
    building: string;
    unitNumber: string;
    contact: string;
    name: string;
    residenceStatus: ResidenceStatus;
    isHouseholder: HouseholdType;
    isRegistered: boolean;
    approvalStatus: ResidentResponseDto['approvalStatus'];
    user?: {
        id: bigint;
        email: string;
    } | null;
}): ResidentResponseDto => {
    return {
        id: resident.id.toString(),
        userId: resident.user?.id.toString() ?? null,
        building: resident.building,
        unitNumber: resident.unitNumber,
        contact: resident.contact,
        name: resident.name,
        email: resident.user?.email ?? null,
        residenceStatus: resident.residenceStatus,
        isHouseholder: resident.isHouseholder,
        isRegistered: resident.isRegistered,
        approvalStatus: resident.approvalStatus,
    };
};

// 입주민 목록 조회
export const getResidents = async ({ apartmentId, query }: GetResidentsParams): Promise<ResidentListResponseDto> => {
    const result = await findResidents({
        apartmentId,
        page: query.page,
        limit: query.limit,
        building: query.building,
        unitNumber: query.unitNumber,
        residenceStatus: query.residenceStatus,
        isRegistered: query.isRegistered,
        keyword: query.keyword,
    });

    return {
        residents: result.residents.map(toResidentResponseDto),
        message: '입주민 목록 조회 성공',
        count: result.residents.length,
        totalCount: result.totalCount,
    };
};

// 입주민 상세 조회
export const getResidentById = async ({ apartmentId, residentId }: GetResidentByIdParams): Promise<ResidentResponseDto> => {
    const resident = await findResidentById(residentId, apartmentId);

    if (!resident) {
        throw new NotFoundError('입주민을 찾을 수 없습니다.');
    }

    return toResidentResponseDto(resident);
};

// 입주민 개별 등록
export const createOneResident = async ({ apartmentId, body }: CreateOneResidentParams): Promise<ResidentResponseDto> => {
    const { building, unitNumber, contact, name, isHouseholder } = body;

    // 같은 아파트 내 중복 입주민 여부 확인
    const duplicated = await existsResident({
        apartmentId,
        building,
        unitNumber,
        contact,
    });

    if (duplicated) {
        throw new ConflictError('이미 등록된 입주민입니다.');
    }

    // 입주민 정보 생성
    const resident = await createResident({
        apartmentId,
        building,
        unitNumber,
        contact,
        name,
        isHouseholder: isHouseholder as HouseholdType,
    });

    return toResidentResponseDto(resident);
};

// 입주민 정보 수정
export const updateResidentById = async ({ apartmentId, residentId, body }: UpdateResidentParams): Promise<ResidentResponseDto> => {
    // 같은 아파트 입주민인지 먼저 확인
    const resident = await findResidentById(residentId, apartmentId);

    if (!resident) {
        throw new NotFoundError('입주민을 찾을 수 없습니다.');
    }

    // 수정된 값 기준으로 중복 여부 확인
    const nextBuilding = body.building ?? resident.building;
    const nextUnitNumber = body.unitNumber ?? resident.unitNumber;
    const nextContact = body.contact ?? resident.contact;

    const duplicated = await existsResident({
        apartmentId,
        building: nextBuilding,
        unitNumber: nextUnitNumber,
        contact: nextContact,
    });

    const isSameResident = resident.building === nextBuilding && resident.unitNumber === nextUnitNumber && resident.contact === nextContact;

    if (duplicated && !isSameResident) {
        throw new ConflictError('이미 등록된 입주민입니다.');
    }

    // 입주민 정보 수정
    const updatedResident = await updateResident({
        residentId,
        apartmentId,
        building: body.building,
        unitNumber: body.unitNumber,
        contact: body.contact,
        name: body.name,
        isHouseholder: body.isHouseholder as HouseholdType | undefined,
    });

    return toResidentResponseDto(updatedResident);
};

// 입주민 정보 삭제
export const deleteResidentById = async ({ apartmentId, residentId }: DeleteResidentParams): Promise<ResidentResponseDto> => {
    // 같은 아파트 입주민인지 먼저 확인
    const resident = await findResidentById(residentId, apartmentId);

    if (!resident) {
        throw new NotFoundError('입주민을 찾을 수 없습니다.');
    }

    // 연결된 계정이 있으면 관련 데이터까지 함께 정리
    const deletedResident = await prisma.$transaction(async (tx) => {
        const linkedUserId = resident.user?.id;

        if (linkedUserId) {
            // 유저 투표 이력 삭제
            await tx.vote.deleteMany({
                where: {
                    userId: linkedUserId,
                },
            });

            // 유저 댓글 삭제
            await tx.comment.deleteMany({
                where: {
                    userId: linkedUserId,
                },
            });
        }

        // 입주민 명부 삭제
        const removedResident = await tx.resident.delete({
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

        if (linkedUserId) {
            // 연결된 유저 삭제
            await tx.user.delete({
                where: {
                    id: linkedUserId,
                },
            });
        }

        return removedResident;
    });

    return toResidentResponseDto(deletedResident);
};
