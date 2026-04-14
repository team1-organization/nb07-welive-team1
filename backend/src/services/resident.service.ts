import { HouseholdType, Prisma, ResidenceStatus } from '../../generated/prisma';
import {
    BulkOperationResponseDto,
    CreateOneResidentDto,
    GetResidentsQueryDto,
    ResidentListResponseDto,
    ResidentResponseDto,
    UpdateResidentDto,
} from '../dtos/resident.dto';
import { BadRequestError } from '../errors/BadRequestError';
import { ConflictError } from '../errors/ConflictError';
import { NotFoundError } from '../errors/NotFoundError';
import { prisma } from '../lib/prisma';
import {
    createResident,
    createResidents,
    existsResident,
    findResidents,
    findResidentsForDownload,
    findResidentWithApartment,
    updateResident,
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

type UpdateResidentParams = {
    apartmentId: bigint;
    residentId: bigint;
    body: UpdateResidentDto;
};

type DeleteResidentParams = {
    apartmentId: bigint;
    residentId: bigint;
};

type DownloadResidentsFileParams = {
    apartmentId: bigint;
    query: GetResidentsQueryDto;
};

type CreateResidentsFromFileParams = {
    apartmentId: bigint;
    fileBuffer: Buffer;
};

type CsvResidentRow = {
    name: string;
    contact: string;
    building: string;
    unitNumber: string;
    isHouseholder: HouseholdType;
};

export type ResidentWithUser = Prisma.ResidentGetPayload<{
    include: { user: { select: { id: true; email: true } } };
}>;

const RESIDENT_TEMPLATE_HEADERS = ['name', 'contact', 'building', 'unitNumber', 'isHouseholder'] as const;
const RESIDENT_DOWNLOAD_HEADERS = ['building', 'unitNumber', 'name', 'contact', 'residenceStatus', 'isHouseholder', 'isRegistered'] as const;

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

// CSV 값 이스케이프
const escapeCsvValue = (value: string | boolean) => {
    const normalized = String(value);

    if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
        return `"${normalized.replace(/"/g, '""')}"`;
    }

    return normalized;
};

// CSV 한 줄 파싱
const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                index += 1;
                continue;
            }

            inQuotes = !inQuotes;
            continue;
        }

        if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
            continue;
        }

        current += char;
    }

    values.push(current.trim());

    return values;
};

// CSV 양식 검증
const validateResidentTemplateHeaders = (headers: string[]) => {
    const normalizedHeaders = headers.map((header) => header.trim());

    const isValid =
        normalizedHeaders.length === RESIDENT_TEMPLATE_HEADERS.length &&
        RESIDENT_TEMPLATE_HEADERS.every((header, index) => normalizedHeaders[index] === header);

    if (!isValid) {
        throw new BadRequestError('파일 양식이 올바르지 않습니다. 양식 다운로드 후 다시 업로드해주세요.');
    }
};

// CSV 업로드용 행 검증
const toCsvResidentRow = (values: string[], rowIndex: number): CsvResidentRow => {
    if (values.length !== RESIDENT_TEMPLATE_HEADERS.length) {
        throw new BadRequestError(`${rowIndex}번째 행의 입력 형식이 올바르지 않습니다.`);
    }

    const [name, contact, building, unitNumber, isHouseholder] = values.map((value) => value.trim());

    if (!name || !contact || !building || !unitNumber || !isHouseholder) {
        throw new BadRequestError(`${rowIndex}번째 행에 입력되지 않은 항목이 있습니다.`);
    }

    if (isHouseholder !== HouseholdType.HOUSEHOLDER && isHouseholder !== HouseholdType.HOUSEMEMBER) {
        throw new BadRequestError(`${rowIndex}번째 행의 세대구분 값이 올바르지 않습니다. HOUSEHOLDER 또는 HOUSEMEMBER로 입력해주세요.`);
    }

    return {
        name,
        contact,
        building,
        unitNumber,
        isHouseholder,
    };
};

// CSV 문자열을 업로드용 행 목록으로 변환
const parseResidentsCsv = (csvText: string) => {
    const normalizedText = csvText.replace(/^\uFEFF/, '').trim();

    if (!normalizedText) {
        throw new BadRequestError('파일이 비어 있습니다.');
    }

    const lines = normalizedText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        throw new BadRequestError('등록할 입주민 데이터가 없습니다.');
    }

    const headerLine = lines[0];

    if (!headerLine) {
        throw new BadRequestError('파일 양식이 올바르지 않습니다. 양식 다운로드 후 다시 업로드해주세요.');
    }

    const headerValues = parseCsvLine(headerLine);
    validateResidentTemplateHeaders(headerValues);

    return lines.slice(1).map((line, index) => {
        const rowIndex = index + 2;
        const values = parseCsvLine(line);

        return toCsvResidentRow(values, rowIndex);
    });
};

// 파일 내부 중복 검증
const validateDuplicatedRows = (rows: CsvResidentRow[]) => {
    const residentKeySet = new Set<string>();

    for (const row of rows) {
        const residentKey = `${row.building}|${row.unitNumber}|${row.contact}`;

        if (residentKeySet.has(residentKey)) {
            throw new ConflictError('동, 호수, 연락처가 동일한 입주민 정보가 파일 안에 중복되어 있습니다.');
        }

        residentKeySet.add(residentKey);
    }
};

// 입주민 업로드 템플릿 다운로드
export const downloadResidentTemplate = (): string => {
    return `${RESIDENT_TEMPLATE_HEADERS.join(',')}\n`;
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

// 입주민 목록 CSV 다운로드
export const downloadResidentsFile = async ({ apartmentId, query }: DownloadResidentsFileParams): Promise<string> => {
    const residents = await findResidentsForDownload({
        apartmentId,
        building: query.building,
        unitNumber: query.unitNumber,
        residenceStatus: query.residenceStatus,
        isRegistered: query.isRegistered,
        keyword: query.keyword,
    });

    const headerLine = RESIDENT_DOWNLOAD_HEADERS.join(',');

    const rows = residents.map((resident) =>
        [
            resident.building,
            resident.unitNumber,
            resident.name,
            resident.contact,
            resident.residenceStatus,
            resident.isHouseholder,
            resident.isRegistered,
        ]
            .map(escapeCsvValue)
            .join(','),
    );

    return `${[headerLine, ...rows].join('\n')}\n`;
};

// 입주민 상세 조회
export const getResidentById = async ({ apartmentId, residentId }: GetResidentByIdParams): Promise<ResidentResponseDto> => {
    const resident = await findResidentWithApartment(residentId, apartmentId);

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

// 파일 업로드로 입주민 다건 등록
export const createResidentsFromFile = async ({ apartmentId, fileBuffer }: CreateResidentsFromFileParams): Promise<BulkOperationResponseDto> => {
    const csvText = fileBuffer.toString('utf-8');
    const rows = parseResidentsCsv(csvText);

    validateDuplicatedRows(rows);

    for (const row of rows) {
        const duplicated = await existsResident({
            apartmentId,
            building: row.building,
            unitNumber: row.unitNumber,
            contact: row.contact,
        });

        if (duplicated) {
            throw new ConflictError('이미 등록된 입주민 정보가 파일에 포함되어 있습니다.');
        }
    }

    const created = await createResidents({
        residents: rows.map((row) => ({
            apartmentId,
            building: row.building,
            unitNumber: row.unitNumber,
            contact: row.contact,
            name: row.name,
            isHouseholder: row.isHouseholder,
        })),
    });

    return {
        message: `${created.count}명의 입주민이 등록되었습니다`,
        count: created.count,
    };
};

// 입주민 정보 수정
export const updateResidentById = async ({ apartmentId, residentId, body }: UpdateResidentParams): Promise<ResidentResponseDto> => {
    // 같은 아파트 입주민인지 먼저 확인
    const resident = await findResidentWithApartment(residentId, apartmentId);

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
    const resident = await findResidentWithApartment(residentId, apartmentId);

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
