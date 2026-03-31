import { HouseholdType } from '../../generated/prisma';
import {
  CreateOneResidentDto,
  GetResidentsQueryDto,
  ResidentListResponseDto,
  ResidentResponseDto,
} from '../dtos/resident.dto';
import { ConflictError } from '../errors/ConflictError';
import { NotFoundError } from '../errors/NotFoundError';
import {
  createResident,
  existsResident,
  findResidentById,
  findResidents,
} from '../repositories/resident.repository';

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

// Resident 모델 데이터를 단건 응답 DTO로 변환
const toResidentResponseDto = (resident: {
  id: bigint;
  userId: bigint | null;
  building: string;
  unitNumber: string;
  contact: string;
  name: string;
  residenceStatus: ResidentResponseDto['residenceStatus'];
  isHouseholder: ResidentResponseDto['isHouseholder'];
  isRegistered: boolean;
  approvalStatus: ResidentResponseDto['approvalStatus'];
  user?: {
    email: string;
  } | null;
}): ResidentResponseDto => {
  return {
    id: resident.id.toString(),
    userId: resident.userId?.toString(),
    building: resident.building,
    unitNumber: resident.unitNumber,
    contact: resident.contact,
    name: resident.name,
    email: resident.user?.email,
    residenceStatus: resident.residenceStatus,
    isHouseholder: resident.isHouseholder,
    isRegistered: resident.isRegistered,
    approvalStatus: resident.approvalStatus,
  };
};

// 입주민 목록 조회 서비스
export const getResidents = async ({
  apartmentId,
  query,
}: GetResidentsParams): Promise<ResidentListResponseDto> => {
  const { residents, totalCount } = await findResidents({
    apartmentId,
    page: query.page,
    limit: query.limit,
    building: query.building,
    unitNumber: query.unitNumber,
    residenceStatus: query.residenceStatus,
    isRegistered: query.isRegistered,
    keyword: query.keyword,
  });

  const residentDtos = residents.map(toResidentResponseDto);

  return {
    residents: residentDtos,
    message: '입주민 목록 조회 성공',
    count: residentDtos.length,
    totalCount,
  };
};

// 입주민 상세 조회 서비스
export const getResidentById = async ({
  apartmentId,
  residentId,
}: GetResidentByIdParams): Promise<ResidentResponseDto> => {
  const resident = await findResidentById(residentId, apartmentId);

  if (!resident) {
    throw new NotFoundError('입주민을 찾을 수 없습니다.');
  }

  return toResidentResponseDto(resident);
};

// 입주민 개별 등록 서비스
export const createOneResident = async ({
  apartmentId,
  body,
}: CreateOneResidentParams): Promise<ResidentResponseDto> => {
  const { building, unitNumber, contact, name, isHouseholder } = body;

  const duplicated = await existsResident({
    apartmentId,
    building,
    unitNumber,
    contact,
  });

  if (duplicated) {
    throw new ConflictError('이미 등록된 입주민입니다.');
  }

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